import { getDb, saveDb, newId, nowIso } from "./mockDb";
import { makeIcon, makeScreenshot } from "./mockImages";
import { ADMIN_SECRET_KEY } from "./seedData";

// ─────────────────────────────────────────────────────────────────────────────
// Mock REST API. Every route below mirrors an endpoint the services call, and
// returns the same envelope the real backend uses: { success, message, data }.
// ─────────────────────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};
const ok = (data = {}, message = "Success") => ({
  success: true,
  message,
  data,
});

const clone = (v) => JSON.parse(JSON.stringify(v));
const newest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const TOKEN_PREFIX = "mock-token.";

// ─── Generic helpers ──────────────────────────────────────────────────────────

function strip(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
}

function userRef(id, withEmail = false) {
  const u = getDb().users.find((x) => x._id === id);
  if (!u) return null;
  return withEmail
    ? { _id: u._id, name: u.name, email: u.email, role: u.role }
    : { _id: u._id, name: u.name, role: u.role };
}

function websiteRef(id) {
  const w = getDb().websites.find((x) => x._id === id);
  if (!w) return null;
  return {
    _id: w._id,
    name: w.name,
    category: w.category,
    icon: w.icon,
    url: w.url,
  };
}

function paginate(list, query = {}) {
  const total = list.length;
  const limit = Number(query.limit) || 0;
  const page = Number(query.page) || 1;
  const items = limit ? list.slice((page - 1) * limit, page * limit) : list;
  return {
    items,
    total,
    page,
    limit: limit || total,
    totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1,
  };
}

function notify(userId, title, message, link = "") {
  getDb().notifications.push({
    _id: newId("n"),
    userId,
    title,
    message,
    link,
    isRead: false,
    createdAt: nowIso(),
  });
}

function logDev(userId, action, targetModel, details = {}) {
  getDb().devAuditLogs.push({
    _id: newId("al"),
    userId,
    role: "developer",
    action,
    targetModel,
    details,
    createdAt: nowIso(),
  });
}

function logAdmin(adminUser, action, target, status = "success", extra = {}) {
  getDb().adminAuditLogs.push({
    _id: newId("aa"),
    action,
    target,
    admin: adminUser?.name ?? "Admin",
    status,
    createdAt: nowIso(),
    ...extra,
  });
}

function decorateWebsite(site, viewer) {
  const db = getDb();
  const rs = db.reviews.filter((r) => r.websiteId === site._id && !r.isHidden);
  const total = rs.length;
  const avg = total
    ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;
  const likes = Object.values(db.wishlists).filter((l) =>
    l.includes(site._id),
  ).length;
  const out = { ...clone(site), averageRating: avg, totalReviews: total, likes };
  if (viewer) {
    out.alreadyReported = db.reports.some(
      (r) =>
        r.reportBy === viewer._id &&
        r.targetType === "website" &&
        r.targetId === site._id,
    );
  }
  return out;
}

function publicReview(r) {
  return { ...clone(r), userId: userRef(r.userId) };
}
function publicReply(r) {
  return { ...clone(r), userId: userRef(r.userId) };
}

function findWebsite(id) {
  const site = getDb().websites.find((w) => w._id === id);
  if (!site) fail(404, "Website not found");
  return site;
}

function requireAuth(ctx) {
  if (!ctx.user) fail(403, "Please log in to continue");
  return ctx.user;
}
function requireRole(ctx, ...roles) {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role)) fail(403, "You are not allowed to do this");
  return user;
}

// ─── File helpers (FormData uploads) ──────────────────────────────────────────

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const original = reader.result;
      // Downscale big images so the persisted mock db stays small.
      if (file.size < 200 * 1024 || typeof document === "undefined") {
        resolve(original);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(original);
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}

export async function parseBody(data) {
  if (!data) return {};
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const out = { files: {} };
    const tags = [];
    for (const [key, value] of data.entries()) {
      if (typeof value === "object" && value !== null) {
        (out.files[key] ||= []).push(value);
      } else if (key === "tags[]") {
        tags.push(value);
      } else {
        out[key] = value;
      }
    }
    if (tags.length) out.tags = tags;
    return out;
  }
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

// ─── Shared domain logic ──────────────────────────────────────────────────────

function randomHealthCheck() {
  return {
    status: "up",
    statusCode: 200,
    responseTime: 150 + Math.floor(Math.random() * 300),
    checkedAt: nowIso(),
    error: null,
  };
}

function validateWebsiteFields(body, { partial = false } = {}) {
  if (!partial || body.name !== undefined) {
    if (!String(body.name ?? "").trim()) fail(400, "Website name is required");
  }
  if (!partial || body.url !== undefined) {
    if (!/^https?:\/\/\S+\.\S+/.test(String(body.url ?? "").trim()))
      fail(400, "Please enter a valid website URL (https://...)");
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags))
    return tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  if (typeof tags === "string")
    return tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  return [];
}

async function createWebsiteRecord(actor, body) {
  validateWebsiteFields(body);
  const db = getDb();
  const index = db.websites.length;
  const iconFile = body.files?.icon?.[0];
  const shots = body.files?.screenshots ?? [];
  const iconUrl = iconFile
    ? ((await fileToDataUrl(iconFile)) ?? makeIcon(body.name, index))
    : makeIcon(body.name, index);
  const screenshots = [];
  for (const f of shots) {
    const url = await fileToDataUrl(f);
    if (url) screenshots.push({ _id: newId("s"), url });
  }
  const site = {
    _id: newId("w"),
    name: String(body.name).trim(),
    url: String(body.url).trim(),
    category: body.category || "Other",
    description: body.description || "",
    tags: normalizeTags(body.tags),
    ownerName: body.ownerName || actor.name,
    ownerId: actor._id,
    icon: { _id: newId("i"), url: iconUrl },
    screenshots: screenshots.length
      ? screenshots
      : [0, 1].map((n) => ({
          _id: newId("s"),
          url: makeScreenshot(`${body.name} — view ${n + 1}`, n),
        })),
    status: actor.role === "admin" ? "active" : "pending",
    approvalStatus: { rejectionReason: "" },
    uniqueVisitors: 0,
    healthCheck: randomHealthCheck(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.websites.push(site);
  return site;
}

function updateWebsiteRecord(site, body, { resubmit = false } = {}) {
  validateWebsiteFields(body, { partial: true });
  ["name", "url", "category", "description", "ownerName"].forEach((k) => {
    if (body[k] !== undefined) site[k] = body[k];
  });
  if (body.tags !== undefined) site.tags = normalizeTags(body.tags);
  if (resubmit && site.status === "rejected") {
    site.status = "pending";
    site.approvalStatus = { rejectionReason: "" };
  }
  site.updatedAt = nowIso();
  return site;
}

async function replaceIcon(site, body) {
  const file = body.files?.icon?.[0];
  if (!file) fail(400, "Icon file is required");
  const url = await fileToDataUrl(file);
  site.icon = { _id: site.icon?._id ?? newId("i"), url };
  site.updatedAt = nowIso();
}

async function replaceScreenshot(site, screenshotId, body) {
  const file = body.files?.screenshot?.[0] ?? body.files?.screenshots?.[0];
  if (!file) fail(400, "Screenshot file is required");
  const url = await fileToDataUrl(file);
  if (screenshotId === "new") {
    site.screenshots.push({ _id: newId("s"), url });
  } else {
    const shot = site.screenshots.find((s) => s._id === screenshotId);
    if (!shot) fail(404, "Screenshot not found");
    shot.url = url;
  }
  site.updatedAt = nowIso();
}

function removeWebsiteCascade(siteId) {
  const db = getDb();
  const reviewIds = db.reviews
    .filter((r) => r.websiteId === siteId)
    .map((r) => r._id);
  db.websites = db.websites.filter((w) => w._id !== siteId);
  db.reviews = db.reviews.filter((r) => r.websiteId !== siteId);
  db.replies = db.replies.filter((r) => !reviewIds.includes(r.reviewId));
  db.reports = db.reports.filter(
    (r) => r.websiteId !== siteId && !reviewIds.includes(r.targetId),
  );
  Object.keys(db.wishlists).forEach((k) => {
    db.wishlists[k] = db.wishlists[k].filter((id) => id !== siteId);
  });
  Object.keys(db.visited).forEach((k) => {
    db.visited[k] = db.visited[k].filter((id) => id !== siteId);
  });
}

function removeUserCascade(userId, { deleteContent = false } = {}) {
  const db = getDb();
  const user = db.users.find((u) => u._id === userId);
  if (!user) return;
  if (user.role === "developer") {
    db.websites
      .filter((w) => w.ownerId === userId)
      .forEach((w) => removeWebsiteCascade(w._id));
  }
  if (deleteContent) {
    const myReviewIds = db.reviews
      .filter((r) => r.userId === userId)
      .map((r) => r._id);
    db.reviews = db.reviews.filter((r) => r.userId !== userId);
    db.replies = db.replies.filter(
      (r) => r.userId !== userId && !myReviewIds.includes(r.reviewId),
    );
  }
  db.users = db.users.filter((u) => u._id !== userId);
  delete db.wishlists[userId];
  delete db.visited[userId];
  delete db.follows[userId];
  db.promotions = db.promotions.filter((p) => p.userId !== userId);
  db.tickets = db.tickets.filter((t) => t.userId !== userId);
  db.notifications = db.notifications.filter((n) => n.userId !== userId);
}

// ── reviews ──
function listWebsiteReviews(websiteId) {
  findWebsite(websiteId);
  return getDb()
    .reviews.filter((r) => r.websiteId === websiteId && !r.isHidden)
    .sort(newest)
    .map(publicReview);
}

function reviewPayload(body) {
  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5)
    fail(400, "Rating must be between 1 and 5");
  return {
    rating,
    design: body.design ?? "",
    functionality: body.functionality ?? "",
    performance: body.performance ?? "",
    additionalComments: body.additionalComments ?? "",
  };
}

function createReviewRecord(user, websiteId, body, devLog = false) {
  const db = getDb();
  const site = findWebsite(websiteId);
  if (!(db.visited[user._id] ?? []).includes(websiteId))
    fail(403, "Visit the website before writing a review");
  if (db.reviews.some((r) => r.websiteId === websiteId && r.userId === user._id))
    fail(409, "You have already reviewed this website");
  const review = {
    _id: newId("r"),
    websiteId,
    userId: user._id,
    ...reviewPayload(body),
    voteUp: 0,
    voteDown: 0,
    voteUpUsers: [],
    voteDownUsers: [],
    isHidden: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.reviews.push(review);
  if (site.ownerId && site.ownerId !== user._id)
    notify(
      site.ownerId,
      "New review",
      `${user.name} reviewed ${site.name} (${review.rating}★).`,
      "/dev?tab=my-websites",
    );
  if (devLog) logDev(user._id, "REVIEW_CREATED", "Review", { website: site.name });
  return review;
}

function updateReviewRecord(user, websiteId, body, devLog = false) {
  const review = getDb().reviews.find(
    (r) => r.websiteId === websiteId && r.userId === user._id,
  );
  if (!review) fail(404, "Review not found");
  Object.assign(review, reviewPayload(body), { updatedAt: nowIso() });
  if (devLog) logDev(user._id, "REVIEW_UPDATED", "Review", {});
  return review;
}

function deleteReviewRecord(user, websiteId, devLog = false) {
  const db = getDb();
  const review = db.reviews.find(
    (r) => r.websiteId === websiteId && r.userId === user._id,
  );
  if (!review) fail(404, "Review not found");
  db.reviews = db.reviews.filter((r) => r._id !== review._id);
  db.replies = db.replies.filter((r) => r.reviewId !== review._id);
  if (devLog) logDev(user._id, "REVIEW_DELETED", "Review", {});
}

function voteOnReview(user, reviewId, voteType) {
  const review = getDb().reviews.find((r) => r._id === reviewId);
  if (!review) fail(404, "Review not found");
  if (review.userId === user._id)
    fail(400, "You can't vote on your own review");
  if (!["up", "down"].includes(voteType)) fail(400, "Invalid vote type");
  const own = voteType === "up" ? "voteUpUsers" : "voteDownUsers";
  const other = voteType === "up" ? "voteDownUsers" : "voteUpUsers";
  if (review[own].includes(user._id)) {
    review[own] = review[own].filter((id) => id !== user._id);
  } else {
    review[own].push(user._id);
    review[other] = review[other].filter((id) => id !== user._id);
  }
  review.voteUp = review.voteUpUsers.length;
  review.voteDown = review.voteDownUsers.length;
  return { voteUp: review.voteUp, voteDown: review.voteDown };
}

function listReplies(reviewId) {
  return getDb()
    .replies.filter((r) => r.reviewId === reviewId && !r.isHidden)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(publicReply);
}

// ── wishlist ──
function wishlistFor(user) {
  const db = getDb();
  const ids = db.wishlists[user._id] ?? [];
  return ids
    .map((id) => db.websites.find((w) => w._id === id))
    .filter(Boolean)
    .map((w) => decorateWebsite(w));
}
function addWishlist(user, websiteId, isDev) {
  const db = getDb();
  const site = findWebsite(websiteId);
  db.wishlists[user._id] ||= [];
  if (!db.wishlists[user._id].includes(websiteId))
    db.wishlists[user._id].push(websiteId);
  if (isDev) logDev(user._id, "WISHLIST_ADDED", "Wishlist", { website: site.name });
}
function removeWishlist(user, websiteId, isDev) {
  const db = getDb();
  const site = db.websites.find((w) => w._id === websiteId);
  db.wishlists[user._id] = (db.wishlists[user._id] ?? []).filter(
    (id) => id !== websiteId,
  );
  if (isDev)
    logDev(user._id, "WISHLIST_REMOVED", "Wishlist", { website: site?.name });
}

// ── profile ──
function myReviews(user) {
  return getDb()
    .reviews.filter((r) => r.userId === user._id)
    .sort(newest)
    .map((r) => ({ ...clone(r), userId: userRef(r.userId), websiteId: websiteRef(r.websiteId) }));
}

function updateProfileName(user, name, isDev) {
  const trimmed = String(name ?? "").trim();
  if (trimmed.length < 3) fail(400, "Name must be at least 3 characters long");
  const u = getDb().users.find((x) => x._id === user._id);
  u.name = trimmed;
  u.updatedAt = nowIso();
  if (isDev) logDev(user._id, "PROFILE_UPDATED", "User", { field: "name" });
  return strip(u);
}

function initiateEmail(user, newEmail) {
  const email = String(newEmail ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) fail(400, "Enter a valid email address");
  if (getDb().users.some((u) => u.email.toLowerCase() === email))
    fail(409, "That email is already in use");
}
function verifyEmail(user, newEmail, otp) {
  if (!otp || String(otp) === "000000") fail(400, "Invalid or expired OTP");
  const u = getDb().users.find((x) => x._id === user._id);
  u.email = String(newEmail).trim().toLowerCase();
  u.updatedAt = nowIso();
}

// ── support ──
function createTicket(user, body, isDev) {
  const subject = String(body.subject ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!subject || !description) fail(400, "Subject and description are required");
  const ticket = {
    _id: newId("t"),
    userId: user._id,
    subject,
    reason: body.reason || "other",
    description,
    status: "open",
    adminResponse: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  getDb().tickets.push(ticket);
  if (isDev)
    logDev(user._id, "SUPPORT_TICKET_CREATED", "SupportTicket", { subject });
  const admin = getDb().users.find((u) => u.role === "admin");
  if (admin)
    notify(admin._id, "New support ticket", `${user.name}: ${subject}`, "/admin?tab=tickets");
  return ticket;
}
function myTickets(user, query = {}) {
  let list = getDb().tickets.filter((t) => t.userId === user._id);
  if (query.status) list = list.filter((t) => t.status === query.status);
  return list.sort(newest);
}
function myTicketById(user, id) {
  const t = getDb().tickets.find((x) => x._id === id && x.userId === user._id);
  if (!t) fail(404, "Ticket not found");
  return t;
}
function deleteMyTicket(user, id) {
  myTicketById(user, id);
  getDb().tickets = getDb().tickets.filter((t) => t._id !== id);
}

// ── follow ──
function followFor(prefix) {
  return {
    follow: (ctx) => {
      const user = requireAuth(ctx);
      const db = getDb();
      const dev = db.users.find((u) => u._id === ctx.params.id);
      if (!dev) fail(404, "Developer not found");
      if (dev._id === user._id) fail(400, "You can't follow yourself");
      db.follows[user._id] ||= [];
      if (!db.follows[user._id].includes(dev._id)) db.follows[user._id].push(dev._id);
      return ok({ isFollowing: true }, "Followed");
    },
    unfollow: (ctx) => {
      const user = requireAuth(ctx);
      const db = getDb();
      db.follows[user._id] = (db.follows[user._id] ?? []).filter(
        (id) => id !== ctx.params.id,
      );
      return ok({ isFollowing: false }, "Unfollowed");
    },
    status: (ctx) => {
      const user = requireAuth(ctx);
      return ok({
        isFollowing: (getDb().follows[user._id] ?? []).includes(ctx.params.id),
      });
    },
    prefix,
  };
}

// ── admin populate helpers ──
function adminReview(r) {
  return {
    ...clone(r),
    userId: userRef(r.userId, true),
    websiteId: websiteRef(r.websiteId) ?? r.websiteId,
  };
}
function adminReply(r) {
  const review = getDb().reviews.find((x) => x._id === r.reviewId);
  return {
    ...clone(r),
    userId: userRef(r.userId, true),
    reviewId: review
      ? { _id: review._id, websiteId: review.websiteId, rating: review.rating }
      : r.reviewId,
  };
}
function adminTicket(t) {
  return { ...clone(t), userId: userRef(t.userId, true) };
}
function reportTarget(r) {
  const db = getDb();
  if (r.targetType === "review") {
    const x = db.reviews.find((v) => v._id === r.targetId);
    if (!x) return null;
    return {
      _id: x._id,
      userId: userRef(x.userId, true),
      rating: x.rating,
      design: x.design,
      functionality: x.functionality,
      performance: x.performance,
      additionalComments: x.additionalComments,
      isHidden: x.isHidden,
      createdAt: x.createdAt,
    };
  }
  if (r.targetType === "reply") {
    const x = db.replies.find((v) => v._id === r.targetId);
    if (!x) return null;
    return {
      _id: x._id,
      userId: userRef(x.userId, true),
      comment: x.comment,
      isHidden: x.isHidden,
      createdAt: x.createdAt,
    };
  }
  const x = db.websites.find((v) => v._id === r.targetId);
  if (!x) return null;
  return {
    _id: x._id,
    name: x.name,
    url: x.url,
    category: x.category,
    description: x.description,
    status: x.status,
    ownerId: x.ownerId,
    ownerName: x.ownerName,
  };
}
function adminReport(r) {
  return {
    ...clone(r),
    reportBy: userRef(r.reportBy, true),
    websiteId: websiteRef(r.websiteId),
    target: reportTarget(r),
  };
}

function createReport(user, targetType, targetId, body) {
  const db = getDb();
  let websiteId;
  if (targetType === "website") {
    findWebsite(targetId);
    websiteId = targetId;
  } else {
    const review = db.reviews.find((r) => r._id === targetId);
    if (!review) fail(404, "Review not found");
    websiteId = review.websiteId;
  }
  if (!body.reason) fail(400, "Please select a reason");
  if (
    db.reports.some(
      (r) =>
        r.reportBy === user._id &&
        r.targetType === targetType &&
        r.targetId === targetId,
    )
  )
    fail(409, "You have already reported this");
  db.reports.push({
    _id: newId("rpt"),
    reportBy: user._id,
    targetType,
    targetId,
    websiteId,
    reason: body.reason,
    additionalText: body.additionalText ?? "",
    status: "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  const admin = db.users.find((u) => u.role === "admin");
  if (admin)
    notify(admin._id, "New report", `A ${targetType} was reported.`, "/admin?tab=reports");
}

// ─── Route table ──────────────────────────────────────────────────────────────

const routes = [];
function route(method, pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:([a-zA-Z]+)/g, (_, k) => {
        keys.push(k);
        return "([^/]+)";
      }) +
      "$",
  );
  routes.push({ method, regex, keys, handler });
}

// ═════ AUTH ═════
route("POST", "/auth/login", (ctx) => {
  const email = String(ctx.body.email ?? "").trim().toLowerCase();
  const user = getDb().users.find(
    (u) => u.email.toLowerCase() === email && u.role !== "admin",
  );
  if (!user || user.password !== ctx.body.password)
    fail(400, "Invalid email or password");
  if (user.accountLocked)
    fail(403, "Your account has been suspended. Please contact support.");
  if (!user.emailVerified) fail(403, "Please verify your email before logging in");
  return ok(
    {
      accessToken: `${TOKEN_PREFIX}${user._id}`,
      user: { userId: user._id, name: user.name, email: user.email, role: user.role },
    },
    "Login successful",
  );
});

route("POST", "/auth/register", (ctx) => {
  const { name, email, password } = ctx.body;
  const db = getDb();
  if (!name || !email || !password) fail(400, "All fields are required");
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase()))
    fail(409, "An account with this email already exists");
  db.users.push({
    _id: newId("u"),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    role: "user",
    password,
    accountLocked: false,
    emailVerified: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return ok({ email }, "Registered. Enter any 6-digit code to verify (demo mode).");
});
route("POST", "/auth/verify-otp", (ctx) => {
  const email = String(ctx.body.email ?? "").toLowerCase();
  const user = getDb().users.find((u) => u.email.toLowerCase() === email);
  if (!user) fail(404, "Account not found");
  if (!ctx.body.otp || String(ctx.body.otp) === "000000")
    fail(400, "Invalid or expired OTP");
  user.emailVerified = true;
  return ok({}, "Email verified");
});
route("POST", "/auth/resend-otp", () => ok({}, "OTP sent"));
route("POST", "/auth/logout", () => ok({}, "Logged out"));
route("POST", "/auth/refresh-token", (ctx) => {
  const user = requireAuth(ctx);
  return ok({ accessToken: `${TOKEN_PREFIX}${user._id}` });
});
route("POST", "/auth/forgot-password", (ctx) => {
  const email = String(ctx.body.email ?? "").toLowerCase();
  if (!getDb().users.some((u) => u.email.toLowerCase() === email))
    fail(404, "No account found with that email");
  return ok({}, "OTP sent (demo mode: enter any 6-digit code)");
});
route("POST", "/auth/verify-forgot-password-otp", (ctx) => {
  if (!ctx.body.otp || String(ctx.body.otp) === "000000")
    fail(400, "Invalid or expired OTP");
  return ok({}, "OTP verified");
});
route("POST", "/auth/resend-forgot-password-otp", () => ok({}, "OTP sent"));
route("POST", "/auth/reset-password", (ctx) => {
  const email = String(ctx.body.email ?? "").toLowerCase();
  const user = getDb().users.find((u) => u.email.toLowerCase() === email);
  if (!user) fail(404, "Account not found");
  user.password = ctx.body.newPassword ?? ctx.body.password ?? user.password;
  return ok({}, "Password reset successful");
});
route("GET", "/auth/me", (ctx) => {
  const user = requireAuth(ctx);
  return ok({ role: user.role, user: strip(user) });
});

route("POST", "/admin/login", (ctx) => {
  const email = String(ctx.body.email ?? "").trim().toLowerCase();
  const user = getDb().users.find(
    (u) => u.email.toLowerCase() === email && u.role === "admin",
  );
  if (
    !user ||
    user.password !== ctx.body.password ||
    ctx.body.secretKey !== ADMIN_SECRET_KEY
  )
    fail(400, "Invalid credentials or secret key");
  return ok(
    {
      accessToken: `${TOKEN_PREFIX}${user._id}`,
      user: { userId: user._id, name: user.name, email: user.email, role: user.role },
    },
    "Admin login successful",
  );
});
route("POST", "/admin/logout", () => ok({}, "Logged out"));
route("POST", "/admin/refresh-token", (ctx) => {
  const user = requireRole(ctx, "admin");
  return ok({ accessToken: `${TOKEN_PREFIX}${user._id}` });
});

// ═════ NOTIFICATIONS ═════
route("GET", "/notifications/preferences", (ctx) => {
  const user = requireAuth(ctx);
  const db = getDb();
  db.userPrefs ||= {};
  db.userPrefs[user._id] ||= clone(db.notificationPrefs[user.role] ?? {});
  return ok(db.userPrefs[user._id]);
});
route("PATCH", "/notifications/preferences", (ctx) => {
  const user = requireAuth(ctx);
  const db = getDb();
  db.userPrefs ||= {};
  db.userPrefs[user._id] = { ...(ctx.body.preferences ?? {}) };
  return ok(db.userPrefs[user._id], "Preferences updated");
});
route("PATCH", "/notifications/read-all", (ctx) => {
  const user = requireAuth(ctx);
  getDb().notifications.forEach((n) => {
    if (n.userId === user._id) n.isRead = true;
  });
  return ok({}, "All notifications marked as read");
});
route("GET", "/notifications", (ctx) => {
  const user = requireAuth(ctx);
  const list = getDb()
    .notifications.filter((n) => n.userId === user._id)
    .sort(newest);
  return ok({
    notifications: list,
    unreadCount: list.filter((n) => !n.isRead).length,
  });
});
route("PATCH", "/notifications/:id/read", (ctx) => {
  const user = requireAuth(ctx);
  const n = getDb().notifications.find(
    (x) => x._id === ctx.params.id && x.userId === user._id,
  );
  if (!n) fail(404, "Notification not found");
  n.isRead = true;
  return ok({}, "Marked as read");
});
route("DELETE", "/notifications/:id", (ctx) => {
  const user = requireAuth(ctx);
  getDb().notifications = getDb().notifications.filter(
    (x) => !(x._id === ctx.params.id && x.userId === user._id),
  );
  return ok({}, "Notification deleted");
});

// ═════ FOLLOW (identical under /user and /dev) ═════
["/user", "/dev"].forEach((prefix) => {
  const f = followFor(prefix);
  route("GET", `${prefix}/follow/:id/status`, f.status);
  route("POST", `${prefix}/follow/:id`, f.follow);
  route("DELETE", `${prefix}/follow/:id`, f.unfollow);
});

// ═════ USER — websites ═════
route("GET", "/user/websites/visited", (ctx) => {
  const user = requireAuth(ctx);
  const db = getDb();
  const sites = (db.visited[user._id] ?? [])
    .map((id) => db.websites.find((w) => w._id === id))
    .filter(Boolean)
    .map((w) => decorateWebsite(w));
  return ok({ websites: sites });
});
route("GET", "/user/websites", () => {
  const sites = getDb()
    .websites.filter((w) => w.status === "active")
    .sort(newest)
    .map((w) => decorateWebsite(w));
  return ok({ websites: sites });
});
route("POST", "/user/websites/:id/visit", (ctx) => {
  const site = findWebsite(ctx.params.id);
  if (ctx.user) {
    const db = getDb();
    db.visited[ctx.user._id] ||= [];
    if (!db.visited[ctx.user._id].includes(site._id)) {
      db.visited[ctx.user._id].push(site._id);
      site.uniqueVisitors = (site.uniqueVisitors ?? 0) + 1;
    }
  }
  return ok({ uniqueVisitors: site.uniqueVisitors }, "Visit recorded");
});
route("POST", "/user/websites/:id/report", (ctx) => {
  const user = requireAuth(ctx);
  createReport(user, "website", ctx.params.id, ctx.body);
  return ok({}, "Website reported");
});
route("GET", "/user/websites/:id", (ctx) => {
  const site = findWebsite(ctx.params.id);
  const isOwner = ctx.user && site.ownerId === ctx.user._id;
  if (site.status !== "active" && !isOwner && ctx.user?.role !== "admin")
    fail(404, "Website not found");
  return ok({ website: decorateWebsite(site, ctx.user) });
});

// ═════ USER — reviews / replies / votes / reports ═════
route("GET", "/user/websites/:id/reviews", (ctx) =>
  ok({ reviews: listWebsiteReviews(ctx.params.id) }),
);
route("POST", "/user/websites/:id/reviews", (ctx) => {
  const user = requireAuth(ctx);
  const review = createReviewRecord(user, ctx.params.id, ctx.body);
  return ok({ review: publicReview(review) }, "Review submitted");
});
route("PATCH", "/user/websites/:id/reviews", (ctx) => {
  const user = requireAuth(ctx);
  const review = updateReviewRecord(user, ctx.params.id, ctx.body);
  return ok({ review: publicReview(review) }, "Review updated");
});
route("DELETE", "/user/websites/:id/reviews", (ctx) => {
  const user = requireAuth(ctx);
  deleteReviewRecord(user, ctx.params.id);
  return ok({}, "Review deleted");
});
route("GET", "/user/reviews/:id/replies", (ctx) =>
  ok({ replies: listReplies(ctx.params.id) }),
);
route("POST", "/user/reviews/:id/report", (ctx) => {
  const user = requireAuth(ctx);
  createReport(user, "review", ctx.params.id, ctx.body);
  return ok({}, "Review reported");
});
route("POST", "/user/reviews/:id/vote", (ctx) => {
  const user = requireAuth(ctx);
  return ok(voteOnReview(user, ctx.params.id, ctx.body.voteType));
});

// ═════ USER — wishlist ═════
route("GET", "/user/wishlist", (ctx) => {
  const user = requireAuth(ctx);
  return ok({ websites: wishlistFor(user) });
});
route("POST", "/user/wishlist/:id", (ctx) => {
  addWishlist(requireAuth(ctx), ctx.params.id, false);
  return ok({}, "Added to wishlist");
});
route("DELETE", "/user/wishlist/:id", (ctx) => {
  removeWishlist(requireAuth(ctx), ctx.params.id, false);
  return ok({}, "Removed from wishlist");
});

// ═════ USER — profile ═════
route("GET", "/user/profile/reviews", (ctx) =>
  ok({ reviews: myReviews(requireAuth(ctx)) }),
);
route("GET", "/user/profile", (ctx) => ok({ user: strip(requireAuth(ctx)) }));
route("PATCH", "/user/profile/name", (ctx) => {
  const user = updateProfileName(requireAuth(ctx), ctx.body.name, false);
  return ok({ user }, "Name updated");
});
route("POST", "/user/profile/email/initiate", (ctx) => {
  initiateEmail(requireAuth(ctx), ctx.body.newEmail);
  return ok({}, "OTP sent (demo mode: enter any 6-digit code)");
});
route("POST", "/user/profile/email/verify", (ctx) => {
  verifyEmail(requireAuth(ctx), ctx.body.newEmail, ctx.body.otp);
  return ok({}, "Email updated");
});
route("POST", "/user/profile/email/resend-otp", () => ok({}, "OTP sent"));
route("DELETE", "/user/profile", (ctx) => {
  const user = requireAuth(ctx);
  removeUserCascade(user._id, { deleteContent: !!ctx.body.deleteContentToo });
  return ok({}, "Account deleted");
});

// ═════ USER — promotions ═════
route("GET", "/user/promotions/status", (ctx) => {
  const user = requireAuth(ctx);
  const latest = getDb()
    .promotions.filter((p) => p.userId === user._id)
    .sort(newest)[0];
  if (!latest) fail(404, "No promotion request found");
  return ok({ promotionRequest: clone(latest) });
});
route("POST", "/user/promotions/request", (ctx) => {
  const user = requireAuth(ctx);
  const db = getDb();
  if (!String(ctx.body.reason ?? "").trim()) fail(400, "Reason is required");
  if (db.promotions.some((p) => p.userId === user._id && p.status === "pending"))
    fail(409, "You already have a pending request");
  db.promotions = db.promotions.filter((p) => p.userId !== user._id);
  const request = {
    _id: newId("pr"),
    userId: user._id,
    status: "pending",
    reason: String(ctx.body.reason).trim(),
    rejectionReason: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.promotions.push(request);
  const admin = db.users.find((u) => u.role === "admin");
  if (admin)
    notify(admin._id, "New developer request", `${user.name} requested developer access.`, "/admin?tab=promotions");
  return ok({ promotionRequest: request }, "Application submitted");
});
route("DELETE", "/user/promotions/:id", (ctx) => {
  const user = requireAuth(ctx);
  getDb().promotions = getDb().promotions.filter(
    (p) => !(p._id === ctx.params.id && p.userId === user._id),
  );
  return ok({}, "Application withdrawn");
});

// ═════ USER — support ═════
route("POST", "/user/support/tickets", (ctx) => {
  const t = createTicket(requireAuth(ctx), ctx.body, false);
  return ok({ ticketId: t._id, ticket: t }, "Ticket submitted");
});
route("GET", "/user/support/:id", (ctx) =>
  ok({ ticket: clone(myTicketById(requireAuth(ctx), ctx.params.id)) }),
);
route("GET", "/user/support", (ctx) =>
  ok({ tickets: clone(myTickets(requireAuth(ctx), ctx.query)) }),
);
route("DELETE", "/user/support/:id", (ctx) => {
  deleteMyTicket(requireAuth(ctx), ctx.params.id);
  return ok({}, "Ticket deleted");
});

// ═════ DEVELOPER ═════
// websites
route("GET", "/dev/websites/my", (ctx) => {
  const user = requireRole(ctx, "developer");
  const sites = getDb()
    .websites.filter((w) => w.ownerId === user._id)
    .sort(newest)
    .map((w) => decorateWebsite(w));
  return ok({ websites: sites });
});
route("GET", "/dev/websites/stats/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  const d = decorateWebsite(site);
  const rs = getDb().reviews.filter((r) => r.websiteId === site._id && !r.isHidden);
  const ratingDistribution = [1, 2, 3, 4, 5].reduce(
    (acc, s) => ({ ...acc, [s]: rs.filter((r) => r.rating === s).length }),
    {},
  );
  return ok({
    stats: {
      totalVisitors: site.uniqueVisitors ?? 0,
      totalReviews: d.totalReviews,
      averageRating: d.averageRating,
      wishlistCount: d.likes,
      ratingDistribution,
    },
  });
});
route("GET", "/dev/websites/reviews/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  return ok({ reviews: listWebsiteReviews(site._id) });
});
route("POST", "/dev/websites", async (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = await createWebsiteRecord(user, ctx.body);
  logDev(user._id, "DEV_WEBSITE_CREATED", "Website", { name: site.name });
  if (ctx.body.files?.icon) logDev(user._id, "DEV_WEBSITE_UPLOADED_ICON", "Website", { name: site.name });
  if (ctx.body.files?.screenshots)
    logDev(user._id, "DEV_WEBSITE_UPLOADED_SCREENSHOTS", "Website", { name: site.name, count: ctx.body.files.screenshots.length });
  const admin = getDb().users.find((u) => u.role === "admin");
  if (admin)
    notify(admin._id, "Website awaiting approval", `${site.name} was submitted by ${user.name}.`, "/admin?tab=approval");
  return ok({ website: decorateWebsite(site) }, "Website created and submitted for approval");
});
route("GET", "/dev/websites/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  return ok({ website: decorateWebsite(site) });
});
route("PATCH", "/dev/websites/:id/icon/update", async (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  await replaceIcon(site, ctx.body);
  logDev(user._id, "DEV_WEBSITE_UPDATED_ICON", "Website", { name: site.name });
  return ok({ website: decorateWebsite(site) }, "Icon updated");
});
route("PATCH", "/dev/websites/:id/screenshots/:sid", async (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  await replaceScreenshot(site, ctx.params.sid, ctx.body);
  logDev(user._id, "DEV_WEBSITE_UPDATED_SCREENSHOT", "Website", { name: site.name });
  return ok({ website: decorateWebsite(site) }, "Screenshot updated");
});
route("PATCH", "/dev/websites/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  updateWebsiteRecord(site, ctx.body, { resubmit: true });
  logDev(user._id, "DEV_WEBSITE_UPDATED", "Website", {
    name: site.name,
    fields: Object.keys(ctx.body).join(", "),
  });
  return ok({ website: decorateWebsite(site) }, "Website updated");
});
route("DELETE", "/dev/websites/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const site = findWebsite(ctx.params.id);
  if (site.ownerId !== user._id) fail(403, "Not your website");
  logDev(user._id, "DEV_WEBSITE_DELETED", "Website", { name: site.name });
  removeWebsiteCascade(site._id);
  return ok({}, "Website deleted");
});

// reviews / replies
route("GET", "/dev/websites/:id/reviews", (ctx) => {
  requireRole(ctx, "developer");
  return ok({ reviews: listWebsiteReviews(ctx.params.id) });
});
route("POST", "/dev/websites/:id/reviews", (ctx) => {
  const user = requireRole(ctx, "developer");
  const review = createReviewRecord(user, ctx.params.id, ctx.body, true);
  return ok({ review: publicReview(review) }, "Review submitted");
});
route("PATCH", "/dev/websites/:id/reviews", (ctx) => {
  const user = requireRole(ctx, "developer");
  const review = updateReviewRecord(user, ctx.params.id, ctx.body, true);
  return ok({ review: publicReview(review) }, "Review updated");
});
route("DELETE", "/dev/websites/:id/reviews", (ctx) => {
  deleteReviewRecord(requireRole(ctx, "developer"), ctx.params.id, true);
  return ok({}, "Review deleted");
});
route("POST", "/dev/reviews/:id/vote", (ctx) => {
  const user = requireRole(ctx, "developer");
  return ok(voteOnReview(user, ctx.params.id, ctx.body.voteType));
});
route("GET", "/dev/reviews/:id/replies", (ctx) => {
  requireRole(ctx, "developer");
  return ok({ replies: listReplies(ctx.params.id) });
});
route("POST", "/dev/reviews/:id/replies", (ctx) => {
  const user = requireRole(ctx, "developer");
  const db = getDb();
  const review = db.reviews.find((r) => r._id === ctx.params.id);
  if (!review) fail(404, "Review not found");
  const comment = String(ctx.body.comment ?? "").trim();
  if (!comment) fail(400, "Reply cannot be empty");
  const reply = {
    _id: newId("rp"),
    reviewId: review._id,
    userId: user._id,
    comment,
    isHidden: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.replies.push(reply);
  const site = db.websites.find((w) => w._id === review.websiteId);
  logDev(user._id, "REPLY_CREATED", "Reply", { website: site?.name });
  if (review.userId !== user._id)
    notify(review.userId, "Developer replied", `${user.name} replied to your review of ${site?.name ?? "a website"}.`, `/website/${review.websiteId}?scroll=reviews`);
  return ok({ reply: publicReply(reply) }, "Reply posted");
});
route("PATCH", "/dev/replies/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const reply = getDb().replies.find((r) => r._id === ctx.params.id);
  if (!reply) fail(404, "Reply not found");
  if (reply.userId !== user._id) fail(403, "You can only edit your own replies");
  const comment = String(ctx.body.comment ?? "").trim();
  if (!comment) fail(400, "Reply cannot be empty");
  reply.comment = comment;
  reply.updatedAt = nowIso();
  logDev(user._id, "REPLY_UPDATED", "Reply", {});
  return ok({ reply: publicReply(reply) }, "Reply updated");
});
route("DELETE", "/dev/replies/:id", (ctx) => {
  const user = requireRole(ctx, "developer");
  const db = getDb();
  const reply = db.replies.find((r) => r._id === ctx.params.id);
  if (!reply) fail(404, "Reply not found");
  if (reply.userId !== user._id) fail(403, "You can only delete your own replies");
  db.replies = db.replies.filter((r) => r._id !== reply._id);
  logDev(user._id, "REPLY_DELETED", "Reply", {});
  return ok({}, "Reply deleted");
});

// wishlist
route("GET", "/dev/wishlist", (ctx) =>
  ok({ websites: wishlistFor(requireRole(ctx, "developer")) }),
);
route("POST", "/dev/wishlist/:id", (ctx) => {
  addWishlist(requireRole(ctx, "developer"), ctx.params.id, true);
  return ok({}, "Added to wishlist");
});
route("DELETE", "/dev/wishlist/:id", (ctx) => {
  removeWishlist(requireRole(ctx, "developer"), ctx.params.id, true);
  return ok({}, "Removed from wishlist");
});

// profile
route("GET", "/dev/profile/reviews", (ctx) =>
  ok({ reviews: myReviews(requireRole(ctx, "developer")) }),
);
route("GET", "/dev/profile", (ctx) =>
  ok({ user: strip(requireRole(ctx, "developer")) }),
);
route("PATCH", "/dev/profile/name", (ctx) => {
  const user = updateProfileName(requireRole(ctx, "developer"), ctx.body.name, true);
  return ok({ user }, "Name updated");
});
route("POST", "/dev/profile/email/initiate", (ctx) => {
  initiateEmail(requireRole(ctx, "developer"), ctx.body.newEmail);
  return ok({}, "OTP sent (demo mode: enter any 6-digit code)");
});
route("POST", "/dev/profile/email/verify", (ctx) => {
  verifyEmail(requireRole(ctx, "developer"), ctx.body.newEmail, ctx.body.otp);
  return ok({}, "Email updated");
});
route("POST", "/dev/profile/email/resend-otp", () => ok({}, "OTP sent"));
route("DELETE", "/dev/profile", (ctx) => {
  const user = requireRole(ctx, "developer");
  removeUserCascade(user._id, { deleteContent: !!ctx.body.deleteContentToo });
  return ok({}, "Account deleted");
});

// support + audit
route("POST", "/dev/support/tickets", (ctx) => {
  const t = createTicket(requireRole(ctx, "developer"), ctx.body, true);
  return ok({ ticketId: t._id, ticket: t }, "Ticket submitted");
});
route("GET", "/dev/support/:id", (ctx) =>
  ok({ ticket: clone(myTicketById(requireRole(ctx, "developer"), ctx.params.id)) }),
);
route("GET", "/dev/support", (ctx) =>
  ok({ tickets: clone(myTickets(requireRole(ctx, "developer"), ctx.query)) }),
);
route("DELETE", "/dev/support/:id", (ctx) => {
  deleteMyTicket(requireRole(ctx, "developer"), ctx.params.id);
  return ok({}, "Ticket deleted");
});
route("GET", "/dev/audit", (ctx) => {
  const user = requireRole(ctx, "developer");
  let logs = getDb().devAuditLogs.filter((l) => l.userId === user._id);
  if (ctx.query.action) logs = logs.filter((l) => l.action === ctx.query.action);
  logs = [...logs].sort(newest);
  const { items, total, page, limit, totalPages } = paginate(logs, ctx.query);
  return ok({ logs: items, meta: { total, page, limit, totalPages } });
});

// ═════ ADMIN ═════
const adminOnly = (handler) => (ctx) => {
  requireRole(ctx, "admin");
  return handler(ctx);
};

// users
route("GET", "/admin/users", adminOnly((ctx) => {
  let list = getDb().users.filter((u) => u.role !== "admin");
  const { role, search } = ctx.query;
  if (role) list = list.filter((u) => u.role === role);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  list = [...list].sort(newest).map(strip);
  const { items, total, page, limit, totalPages } = paginate(list, ctx.query);
  return ok({ users: items, total, meta: { total, page, limit, totalPages } });
}));
route("GET", "/admin/users/:id", adminOnly((ctx) => {
  const u = getDb().users.find((x) => x._id === ctx.params.id);
  if (!u) fail(404, "User not found");
  return ok({ user: strip(u) });
}));
route("PATCH", "/admin/users/:id/ban", adminOnly((ctx) => {
  const u = getDb().users.find((x) => x._id === ctx.params.id);
  if (!u) fail(404, "User not found");
  u.accountLocked = true;
  logAdmin(ctx.user, "USER_BANNED", u.name, "warning");
  return ok({ user: strip(u) }, "User banned");
}));
route("PATCH", "/admin/users/:id/unban", adminOnly((ctx) => {
  const u = getDb().users.find((x) => x._id === ctx.params.id);
  if (!u) fail(404, "User not found");
  u.accountLocked = false;
  logAdmin(ctx.user, "USER_UNBANNED", u.name);
  return ok({ user: strip(u) }, "User unbanned");
}));
route("PATCH", "/admin/users/:id/demote", adminOnly((ctx) => {
  const u = getDb().users.find((x) => x._id === ctx.params.id);
  if (!u) fail(404, "User not found");
  if (u.role !== "developer") fail(400, "Only developers can be demoted");
  u.role = "user";
  logAdmin(ctx.user, "USER_DEMOTED", u.name, "warning");
  return ok({ user: strip(u) }, "Developer demoted to user");
}));
route("DELETE", "/admin/users/:id", adminOnly((ctx) => {
  const u = getDb().users.find((x) => x._id === ctx.params.id);
  if (!u) fail(404, "User not found");
  logAdmin(ctx.user, "USER_DELETED", u.name, "error");
  removeUserCascade(u._id);
  return ok({}, "User deleted");
}));

// websites
const adminSite = (w) => decorateWebsite(w);
route("GET", "/admin/websites/pending", adminOnly((ctx) => {
  const list = getDb()
    .websites.filter((w) => w.status === "pending")
    .sort(newest)
    .map(adminSite);
  const { items, total, page, limit, totalPages } = paginate(list, ctx.query);
  return ok({ websites: items, total, meta: { total, page, limit, totalPages } });
}));
route("GET", "/admin/websites", adminOnly((ctx) => {
  let list = getDb().websites;
  const { status, category, search } = ctx.query;
  if (status) list = list.filter((w) => w.status === status);
  if (category) list = list.filter((w) => w.category === category);
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((w) => w.name.toLowerCase().includes(q));
  }
  list = [...list].sort(newest).map(adminSite);
  const { items, total, page, limit, totalPages } = paginate(list, ctx.query);
  return ok({ websites: items, total, meta: { total, page, limit, totalPages } });
}));
route("POST", "/admin/websites", adminOnly(async (ctx) => {
  const site = await createWebsiteRecord(ctx.user, ctx.body);
  logAdmin(ctx.user, "WEBSITE_CREATED", site.name);
  return ok({ website: adminSite(site) }, "Website created");
}));
route("POST", "/admin/websites/:id/health-check", adminOnly((ctx) => {
  const site = findWebsite(ctx.params.id);
  site.healthCheck = randomHealthCheck();
  return ok({ healthCheck: site.healthCheck }, "Health check completed");
}));
route("GET", "/admin/websites/:id/stats", adminOnly((ctx) => {
  const d = adminSite(findWebsite(ctx.params.id));
  return ok({
    stats: {
      totalVisitors: d.uniqueVisitors ?? 0,
      totalReviews: d.totalReviews,
      averageRating: d.averageRating,
      wishlistCount: d.likes,
    },
  });
}));
route("PATCH", "/admin/websites/:id/approve", adminOnly((ctx) => {
  const site = findWebsite(ctx.params.id);
  site.status = "active";
  site.approvalStatus = { rejectionReason: "" };
  site.updatedAt = nowIso();
  logAdmin(ctx.user, "WEBSITE_APPROVED", site.name);
  notify(site.ownerId, "Website approved", `${site.name} is now live on WebStore.`, "/dev?tab=my-websites");
  return ok({ website: adminSite(site) }, "Website approved");
}));
route("PATCH", "/admin/websites/:id/reject", adminOnly((ctx) => {
  const site = findWebsite(ctx.params.id);
  const reason = String(ctx.body.rejectionReason ?? "").trim();
  if (reason.length < 10) fail(400, "Rejection reason must be at least 10 characters");
  site.status = "rejected";
  site.approvalStatus = { rejectionReason: reason };
  site.updatedAt = nowIso();
  logAdmin(ctx.user, "WEBSITE_REJECTED", site.name, "warning", { reason });
  notify(site.ownerId, "Website rejected", `${site.name} was rejected: ${reason}`, "/dev?tab=my-websites");
  return ok({ website: adminSite(site) }, "Website rejected");
}));
route("PATCH", "/admin/websites/:id/icon/update", adminOnly(async (ctx) => {
  const site = findWebsite(ctx.params.id);
  await replaceIcon(site, ctx.body);
  return ok({ website: adminSite(site) }, "Icon updated");
}));
route("PATCH", "/admin/websites/:id/icon", adminOnly(async (ctx) => {
  const site = findWebsite(ctx.params.id);
  await replaceIcon(site, ctx.body);
  return ok({ website: adminSite(site) }, "Icon uploaded");
}));
route("PATCH", "/admin/websites/:id/screenshots/:sid", adminOnly(async (ctx) => {
  const site = findWebsite(ctx.params.id);
  await replaceScreenshot(site, ctx.params.sid, ctx.body);
  return ok({ website: adminSite(site) }, "Screenshot updated");
}));
route("PATCH", "/admin/websites/:id/screenshots", adminOnly(async (ctx) => {
  const site = findWebsite(ctx.params.id);
  for (const f of ctx.body.files?.screenshots ?? []) {
    await replaceScreenshot(site, "new", { files: { screenshot: [f] } });
  }
  return ok({ website: adminSite(site) }, "Screenshots uploaded");
}));
route("PATCH", "/admin/websites/:id", adminOnly((ctx) => {
  const site = findWebsite(ctx.params.id);
  updateWebsiteRecord(site, ctx.body);
  logAdmin(ctx.user, "WEBSITE_UPDATED", site.name);
  return ok({ website: adminSite(site) }, "Website updated");
}));
route("GET", "/admin/websites/:id", adminOnly((ctx) =>
  ok({ website: adminSite(findWebsite(ctx.params.id)) }),
));
route("DELETE", "/admin/websites/:id", adminOnly((ctx) => {
  const site = findWebsite(ctx.params.id);
  logAdmin(ctx.user, "WEBSITE_DELETED", site.name, "error");
  removeWebsiteCascade(site._id);
  return ok({}, "Website deleted");
}));

// promotions
route("GET", "/admin/promotions", adminOnly(() => {
  const list = [...getDb().promotions].sort(newest).map((p) => ({
    ...clone(p),
    userId: userRef(p.userId, true) ?? { _id: p.userId, name: "Deleted User", email: "" },
  }));
  return ok({ promotions: list });
}));
route("PATCH", "/admin/promotions/:id/approve", adminOnly((ctx) => {
  const p = getDb().promotions.find((x) => x._id === ctx.params.id);
  if (!p) fail(404, "Request not found");
  p.status = "approved";
  p.updatedAt = nowIso();
  const u = getDb().users.find((x) => x._id === p.userId);
  if (u) {
    u.role = "developer";
    notify(u._id, "Developer access granted", "Your developer application was approved. Log in again to see the Dev Portal.", "/profile?section=developer");
  }
  logAdmin(ctx.user, "PROMOTION_APPROVED", u?.name ?? p.userId);
  return ok({ promotion: clone(p) }, "Promotion approved");
}));
route("PATCH", "/admin/promotions/:id/reject", adminOnly((ctx) => {
  const p = getDb().promotions.find((x) => x._id === ctx.params.id);
  if (!p) fail(404, "Request not found");
  p.status = "rejected";
  p.rejectionReason = String(ctx.body.rejectionReason ?? "").trim();
  p.updatedAt = nowIso();
  const u = getDb().users.find((x) => x._id === p.userId);
  if (u) notify(u._id, "Developer application rejected", p.rejectionReason || "Your application was not approved.", "/profile?section=developer");
  logAdmin(ctx.user, "PROMOTION_REJECTED", u?.name ?? p.userId, "warning");
  return ok({ promotion: clone(p) }, "Promotion rejected");
}));

// reviews & replies
route("GET", "/admin/reviews", adminOnly(() =>
  ok({ reviews: [...getDb().reviews].sort(newest).map(adminReview) }),
));
route("PATCH", "/admin/reviews/:id/hide", adminOnly((ctx) => {
  const r = getDb().reviews.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Review not found");
  r.isHidden = true;
  logAdmin(ctx.user, "REVIEW_HIDDEN", `Review ${r._id}`, "warning");
  return ok({ review: adminReview(r) }, "Review hidden");
}));
route("PATCH", "/admin/reviews/:id/unhide", adminOnly((ctx) => {
  const r = getDb().reviews.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Review not found");
  r.isHidden = false;
  logAdmin(ctx.user, "REVIEW_UNHIDDEN", `Review ${r._id}`);
  return ok({ review: adminReview(r) }, "Review unhidden");
}));
route("DELETE", "/admin/reviews/:id", adminOnly((ctx) => {
  const db = getDb();
  const r = db.reviews.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Review not found");
  db.reviews = db.reviews.filter((x) => x._id !== r._id);
  db.replies = db.replies.filter((x) => x.reviewId !== r._id);
  logAdmin(ctx.user, "REVIEW_DELETED", `Review ${r._id}`, "error");
  return ok({}, "Review deleted");
}));
route("GET", "/admin/replies", adminOnly(() =>
  ok({ replies: [...getDb().replies].sort(newest).map(adminReply) }),
));
route("PATCH", "/admin/replies/:id/hide", adminOnly((ctx) => {
  const r = getDb().replies.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Reply not found");
  r.isHidden = true;
  logAdmin(ctx.user, "REPLY_HIDDEN", `Reply ${r._id}`, "warning");
  return ok({ reply: adminReply(r) }, "Reply hidden");
}));
route("PATCH", "/admin/replies/:id/unhide", adminOnly((ctx) => {
  const r = getDb().replies.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Reply not found");
  r.isHidden = false;
  logAdmin(ctx.user, "REPLY_UNHIDDEN", `Reply ${r._id}`);
  return ok({ reply: adminReply(r) }, "Reply unhidden");
}));
route("DELETE", "/admin/replies/:id", adminOnly((ctx) => {
  const db = getDb();
  const r = db.replies.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Reply not found");
  db.replies = db.replies.filter((x) => x._id !== r._id);
  logAdmin(ctx.user, "REPLY_DELETED", `Reply ${r._id}`, "error");
  return ok({}, "Reply deleted");
}));

// support tickets
route("GET", "/admin/support", adminOnly((ctx) => {
  let list = getDb().tickets;
  if (ctx.query.status) list = list.filter((t) => t.status === ctx.query.status);
  list = [...list].sort(newest).map(adminTicket);
  const { items, total, page, limit, totalPages } = paginate(list, ctx.query);
  return ok({ tickets: items, total, meta: { total, page, limit, totalPages } });
}));
route("PATCH", "/admin/support/:id/resolve", adminOnly((ctx) => {
  const t = getDb().tickets.find((x) => x._id === ctx.params.id);
  if (!t) fail(404, "Ticket not found");
  const message = String(ctx.body.message ?? "").trim();
  if (!message) fail(400, "A response message is required");
  t.status = "resolved";
  t.adminResponse = { message, respondedAt: nowIso() };
  t.updatedAt = nowIso();
  notify(t.userId, "Ticket resolved", `Your support ticket “${t.subject}” was resolved.`, "/profile?section=support");
  logAdmin(ctx.user, "TICKET_RESOLVED", t.subject);
  return ok({ ticket: adminTicket(t) }, "Ticket resolved");
}));
route("GET", "/admin/support/:id", adminOnly((ctx) => {
  const t = getDb().tickets.find((x) => x._id === ctx.params.id);
  if (!t) fail(404, "Ticket not found");
  return ok({ ticket: adminTicket(t) });
}));
route("DELETE", "/admin/support/:id", adminOnly((ctx) => {
  const t = getDb().tickets.find((x) => x._id === ctx.params.id);
  if (!t) fail(404, "Ticket not found");
  getDb().tickets = getDb().tickets.filter((x) => x._id !== t._id);
  logAdmin(ctx.user, "TICKET_DELETED", t.subject, "error");
  return ok({}, "Ticket deleted");
}));

// reports
route("GET", "/admin/reports", adminOnly((ctx) => {
  let list = getDb().reports;
  if (ctx.query.status) list = list.filter((r) => r.status === ctx.query.status);
  list = [...list].sort(newest).map(adminReport);
  const { items, total, page, limit, totalPages } = paginate(list, ctx.query);
  return ok({ reports: items, total, meta: { total, page, limit, totalPages } });
}));
const setReportStatus = (status, action, tone) =>
  adminOnly((ctx) => {
    const r = getDb().reports.find((x) => x._id === ctx.params.id);
    if (!r) fail(404, "Report not found");
    r.status = status;
    r.updatedAt = nowIso();
    logAdmin(ctx.user, action, `${r.targetType} ${r.targetId}`, tone);
    return ok({ report: adminReport(r) }, `Report ${status}`);
  });
route("PATCH", "/admin/reports/:id/resolve", setReportStatus("resolved", "REPORT_RESOLVED", "success"));
route("PATCH", "/admin/reports/:id/dismiss", setReportStatus("dismissed", "REPORT_DISMISSED", "success"));
route("DELETE", "/admin/reports/:id", adminOnly((ctx) => {
  const r = getDb().reports.find((x) => x._id === ctx.params.id);
  if (!r) fail(404, "Report not found");
  getDb().reports = getDb().reports.filter((x) => x._id !== r._id);
  return ok({}, "Report deleted");
}));

// audit logs
route("GET", "/admin/audit-logs", adminOnly((ctx) => {
  const list = [...getDb().adminAuditLogs].sort(newest);
  const { items, total, page, limit, totalPages } = paginate(list, ctx.query);
  return ok({ logs: items, total, meta: { total, page, limit, totalPages } });
}));

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function dispatch({ method, path, query, rawBody, token }) {
  const db = getDb();
  const user = token?.startsWith(TOKEN_PREFIX)
    ? (db.users.find((u) => u._id === token.slice(TOKEN_PREFIX.length)) ?? null)
    : null;

  if (user?.accountLocked) fail(403, "Your account has been suspended.");

  for (const r of routes) {
    if (r.method !== method) continue;
    const match = r.regex.exec(path);
    if (!match) continue;
    const params = {};
    r.keys.forEach((k, i) => {
      params[k] = decodeURIComponent(match[i + 1]);
    });
    const body = await parseBody(rawBody);
    const result = await r.handler({ method, path, query, body, params, user });
    if (method !== "GET") saveDb();
    return result;
  }
  return fail(404, `Mock API: no handler for ${method} ${path}`);
}

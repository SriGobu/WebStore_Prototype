import { makeIcon, makeScreenshot } from "./mockImages";

// ─── Demo credentials (shown on the main page) ────────────────────────────────
export const DEMO_PASSWORD = "Demo@1234";
export const ADMIN_SECRET_KEY = "admin-secret";

export const DEMO_ACCOUNTS = {
  user: { email: "user@webstore.dev", password: DEMO_PASSWORD },
  developer: { email: "dev@webstore.dev", password: DEMO_PASSWORD },
  admin: {
    email: "admin@webstore.dev",
    password: DEMO_PASSWORD,
    secretKey: ADMIN_SECRET_KEY,
  },
};

const daysAgo = (n, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

// ─── Users ────────────────────────────────────────────────────────────────────
const U = (id, name, email, role, extra = {}) => ({
  _id: id,
  name,
  email,
  role,
  password: DEMO_PASSWORD,
  accountLocked: false,
  emailVerified: true,
  createdAt: daysAgo(120),
  updatedAt: daysAgo(10),
  ...extra,
});

const users = [
  U("u_admin", "Admin Root", "admin@webstore.dev", "admin", {
    createdAt: daysAgo(300),
  }),
  U("u_dev1", "Ravi Kumar", "dev@webstore.dev", "developer", {
    createdAt: daysAgo(200),
  }),
  U("u_dev2", "Meera Nair", "meera@webstore.dev", "developer", {
    createdAt: daysAgo(160),
  }),
  U("u_dev3", "Sam Carter", "sam@webstore.dev", "developer", {
    createdAt: daysAgo(90),
  }),
  U("u_dev4", "Lena Park", "lena@webstore.dev", "developer", {
    createdAt: daysAgo(40),
    accountLocked: true,
  }),
  U("u_user1", "Demo User", "user@webstore.dev", "user", {
    createdAt: daysAgo(100),
  }),
  U("u_user2", "Priya Sharma", "priya@webstore.dev", "user", {
    createdAt: daysAgo(80),
  }),
  U("u_user3", "John Mathew", "john@webstore.dev", "user", {
    createdAt: daysAgo(70),
  }),
  U("u_user4", "Aisha Khan", "aisha@webstore.dev", "user", {
    createdAt: daysAgo(55),
  }),
  U("u_user5", "Liam Walker", "liam@webstore.dev", "user", {
    createdAt: daysAgo(30),
    accountLocked: true,
  }),
  U("u_user6", "Nora Fischer", "nora@webstore.dev", "user", {
    createdAt: daysAgo(12),
    emailVerified: false,
  }),
];

// ─── Websites ─────────────────────────────────────────────────────────────────
const W = (i, id, name, url, category, tags, owner, ownerId, description, extra) => ({
  _id: id,
  name,
  url,
  category,
  tags,
  ownerName: owner,
  ownerId,
  description,
  icon: { _id: `${id}_icon`, url: makeIcon(name, i) },
  screenshots: [0, 1, 2].map((n) => ({
    _id: `${id}_s${n + 1}`,
    url: makeScreenshot(`${name} — view ${n + 1}`, n + i),
  })),
  status: "active",
  approvalStatus: { rejectionReason: "" },
  uniqueVisitors: 0,
  likes: 0,
  healthCheck: {
    status: "up",
    statusCode: 200,
    responseTime: 180 + i * 23,
    checkedAt: daysAgo(1),
    error: null,
  },
  createdAt: daysAgo(60 - i * 3),
  updatedAt: daysAgo(5),
  ...extra,
});

const websites = [
  W(0, "w_001", "TaskNest", "https://example.com/tasknest", "Productivity", ["tasks", "planner", "teams"], "Ravi Kumar", "u_dev1",
    "TaskNest is a calm, fast task manager for small teams. Plan sprints, assign owners and keep every deadline visible without drowning in notifications.\n\nIncludes boards, recurring tasks and a weekly review digest.",
    { uniqueVisitors: 1840 }),
  W(1, "w_002", "CodeCanvas", "https://example.com/codecanvas", "Developer Tools", ["editor", "snippets", "api"], "Ravi Kumar", "u_dev1",
    "CodeCanvas lets you sketch API flows, save reusable snippets and share runnable examples with your team in one shared workspace.",
    { uniqueVisitors: 1260 }),
  W(2, "w_003", "PaletteLab", "https://example.com/palettelab", "Design", ["colors", "palette", "ui"], "Meera Labs", "u_dev2",
    "Generate accessible colour palettes, check contrast instantly and export design tokens for CSS, Tailwind and Figma.",
    { uniqueVisitors: 980 }),
  W(3, "w_004", "MetricsPilot", "https://example.com/metricspilot", "Analytics", ["dashboard", "charts", "kpi"], "Meera Labs", "u_dev2",
    "Connect your data sources and get a clean KPI dashboard in minutes. Share read-only boards with stakeholders.",
    { uniqueVisitors: 1510 }),
  W(4, "w_005", "PennyWise", "https://example.com/pennywise", "Finance", ["budget", "expenses", "savings"], "Northwind Studio", "u_dev3",
    "Track spending, set monthly budgets and see where your money goes with simple charts and gentle nudges.",
    { uniqueVisitors: 720 }),
  W(5, "w_006", "LearnLoop", "https://example.com/learnloop", "Education", ["flashcards", "study", "spaced repetition"], "Northwind Studio", "u_dev3",
    "Spaced-repetition flashcards that adapt to how you learn. Import decks, track streaks and study offline.",
    { uniqueVisitors: 640 }),
  W(6, "w_007", "FocusFlow", "https://example.com/focusflow", "Productivity", ["pomodoro", "focus", "timer"], "Ravi Kumar", "u_dev1",
    "A distraction-free Pomodoro timer with ambient sounds, session history and daily focus goals.",
    { uniqueVisitors: 530 }),
  W(7, "w_008", "BeatBox Studio", "https://example.com/beatbox", "Entertainment", ["music", "beats", "creator"], "Meera Labs", "u_dev2",
    "Make beats in the browser with a step sequencer, drum kits and one-click export to share with friends.",
    { uniqueVisitors: 410 }),
  W(8, "w_009", "DocuSnap", "https://example.com/docusnap", "Other", ["pdf", "scan", "documents"], "Northwind Studio", "u_dev3",
    "Scan, clean up and convert documents to searchable PDFs from any device.",
    { uniqueVisitors: 295 }),
  W(9, "w_010", "ShipLog", "https://example.com/shiplog", "Developer Tools", ["changelog", "releases", "docs"], "Ravi Kumar", "u_dev1",
    "Publish beautiful changelogs and release notes automatically from your commits and pull requests.",
    { status: "pending", uniqueVisitors: 0, healthCheck: { status: "up", statusCode: 200, responseTime: 240, checkedAt: daysAgo(1), error: null } }),
  W(10, "w_011", "PixelPerfect", "https://example.com/pixelperfect", "Design", ["mockup", "screenshots", "devices"], "Meera Labs", "u_dev2",
    "Drop your screenshots into polished device mockups for launch posts and app store pages.",
    { status: "pending", uniqueVisitors: 0, healthCheck: { status: "down", statusCode: 503, responseTime: 3100, checkedAt: daysAgo(1), error: "Service unavailable" } }),
  W(11, "w_012", "QuickInvoice", "https://example.com/quickinvoice", "Finance", ["invoice", "freelance", "billing"], "Northwind Studio", "u_dev3",
    "Create and send professional invoices in under a minute, with automatic payment reminders.",
    { status: "rejected", approvalStatus: { rejectionReason: "The submitted URL does not load a working product page. Please fix the link and resubmit." }, uniqueVisitors: 0 }),
];

// ─── Reviews ──────────────────────────────────────────────────────────────────
const R = (id, websiteId, userId, rating, design, functionality, performance, extra, daysBack) => ({
  _id: id,
  websiteId,
  userId,
  rating,
  design,
  functionality,
  performance,
  additionalComments: extra || "",
  voteUp: 0,
  voteDown: 0,
  voteUpUsers: [],
  voteDownUsers: [],
  isHidden: false,
  createdAt: daysAgo(daysBack),
  updatedAt: daysAgo(daysBack),
});

const reviews = [
  R("r_001", "w_001", "u_user1", 5, "Clean layout, very easy to find things.", "Does exactly what it promises — boards and recurring tasks just work.", "Loads instantly, even with hundreds of tasks.", "Switched my whole team over.", 20),
  R("r_002", "w_001", "u_user2", 4, "Nice and minimal.", "Great core features, would love more integrations.", "Fast.", "", 15),
  R("r_003", "w_001", "u_user3", 5, "Beautiful.", "Perfect for sprint planning.", "", "Weekly digest is a great touch.", 9),
  R("r_004", "w_002", "u_user2", 4, "Dense but readable.", "Snippets sharing is the killer feature.", "Occasionally laggy on huge files.", "", 18),
  R("r_005", "w_002", "u_user4", 5, "Looks professional.", "Everything worked first try.", "Quick.", "Great for onboarding new devs.", 11),
  R("r_006", "w_003", "u_user1", 5, "Gorgeous palettes.", "Contrast checker is spot on.", "Instant.", "", 22),
  R("r_007", "w_003", "u_user3", 3, "Good, but the sidebar is crowded.", "Token export missed a format I needed.", "Fine.", "", 7),
  R("r_008", "w_004", "u_user4", 4, "Charts are crisp.", "Connectors are easy to set up.", "Slower with large datasets.", "", 14),
  R("r_009", "w_004", "u_user2", 4, "", "Reliable KPIs.", "Good.", "", 6),
  R("r_010", "w_005", "u_user1", 3, "Simple but a bit plain.", "Budgets work, no bank sync yet.", "Fast.", "", 13),
  R("r_011", "w_006", "u_user3", 5, "Friendly UI.", "Spaced repetition actually helps.", "Offline mode is great.", "", 10),
  R("r_012", "w_007", "u_user4", 4, "Calm and focused.", "Timer is reliable.", "", "Ambient sounds are lovely.", 5),
  R("r_013", "w_008", "u_user2", 2, "Confusing at first.", "Export failed once.", "Heavy on older laptops.", "Needs tutorials.", 4),
];
reviews.find((r) => r._id === "r_001").voteUp = 2;
reviews.find((r) => r._id === "r_001").voteUpUsers = ["u_user2", "u_user3"];
reviews.find((r) => r._id === "r_005").voteUp = 1;
reviews.find((r) => r._id === "r_005").voteUpUsers = ["u_user1"];
reviews.find((r) => r._id === "r_013").voteDown = 1;
reviews.find((r) => r._id === "r_013").voteDownUsers = ["u_user1"];

// ─── Replies ──────────────────────────────────────────────────────────────────
const replies = [
  { _id: "rp_001", reviewId: "r_001", userId: "u_dev1", comment: "Thanks for the kind words — glad TaskNest works for your team!", isHidden: false, createdAt: daysAgo(19), updatedAt: daysAgo(19) },
  { _id: "rp_002", reviewId: "r_002", userId: "u_dev1", comment: "More integrations are on the roadmap for next quarter.", isHidden: false, createdAt: daysAgo(14), updatedAt: daysAgo(14) },
  { _id: "rp_003", reviewId: "r_007", userId: "u_dev2", comment: "Thanks for the feedback! We're adding more export formats soon.", isHidden: false, createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  { _id: "rp_004", reviewId: "r_013", userId: "u_dev2", comment: "Sorry about the export issue — a fix is rolling out this week.", isHidden: false, createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { _id: "rp_005", reviewId: "r_004", userId: "u_user3", comment: "Same experience here, snippets sharing is great.", isHidden: false, createdAt: daysAgo(10), updatedAt: daysAgo(10) },
];

// ─── Per-user state ───────────────────────────────────────────────────────────
const wishlists = {
  u_user1: ["w_002", "w_004"],
  u_dev1: ["w_003"],
};

// websites each account has "visited" (needed to be allowed to write a review)
const visited = {
  u_user1: ["w_001", "w_003", "w_005", "w_006"],
  u_user2: ["w_001", "w_002", "w_004", "w_008"],
  u_user3: ["w_001", "w_003", "w_006"],
  u_user4: ["w_002", "w_004", "w_007"],
  u_dev1: ["w_003", "w_004"],
};

const follows = { u_user1: ["u_dev2"] };

// ─── Promotions (user → developer requests) ───────────────────────────────────
const promotions = [
  { _id: "pr_001", userId: "u_user2", status: "pending", reason: "I build small web tools in my spare time and would like to publish them on WebStore.", rejectionReason: "", createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { _id: "pr_002", userId: "u_user4", status: "pending", reason: "Front-end developer with three shipped side projects. Ready to list them.", rejectionReason: "", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { _id: "pr_003", userId: "u_user3", status: "rejected", reason: "Want to upload things.", rejectionReason: "Please describe the kind of websites you plan to publish and add some detail.", createdAt: daysAgo(25), updatedAt: daysAgo(20) },
  { _id: "pr_004", userId: "u_dev3", status: "approved", reason: "Studio building finance and education tools.", rejectionReason: "", createdAt: daysAgo(92), updatedAt: daysAgo(90) },
];

// ─── Support tickets ──────────────────────────────────────────────────────────
const tickets = [
  { _id: "t_001", userId: "u_user1", subject: "Cannot find my review", reason: "general_inquiry", description: "I wrote a review last week but I can't edit it from my activity page.", status: "resolved", adminResponse: { message: "You can edit a review from the website page via the three-dot menu on your review.", respondedAt: daysAgo(8) }, createdAt: daysAgo(10), updatedAt: daysAgo(8) },
  { _id: "t_002", userId: "u_user1", subject: "Feature idea: dark mode", reason: "feature_request", description: "Would love a dark theme for night browsing.", status: "open", adminResponse: null, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { _id: "t_003", userId: "u_dev1", subject: "Website still pending", reason: "website_approval_issue", description: "ShipLog has been pending for over a week. Could you take a look?", status: "open", adminResponse: null, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { _id: "t_004", userId: "u_dev2", subject: "Screenshot upload fails", reason: "bug_report", description: "Uploading a 4MB PNG shows an error toast.", status: "resolved", adminResponse: { message: "Fixed — please try again. Max size is 5MB.", respondedAt: daysAgo(4) }, createdAt: daysAgo(6), updatedAt: daysAgo(4) },
  { _id: "t_005", userId: "u_user4", subject: "Email not verified", reason: "other", description: "I never received my verification email.", status: "open", adminResponse: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
];

// ─── Reports ──────────────────────────────────────────────────────────────────
const reports = [
  { _id: "rpt_001", reportBy: "u_user2", targetType: "review", targetId: "r_013", websiteId: "w_008", reason: "off-topic", additionalText: "This review does not describe the website.", status: "pending", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { _id: "rpt_002", reportBy: "u_user3", targetType: "website", targetId: "w_009", websiteId: "w_009", reason: "spam", additionalText: "Looks like self-promotion with no real product.", status: "pending", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { _id: "rpt_003", reportBy: "u_user4", targetType: "review", targetId: "r_007", websiteId: "w_003", reason: "fake", additionalText: "", status: "resolved", createdAt: daysAgo(9), updatedAt: daysAgo(7) },
  { _id: "rpt_004", reportBy: "u_user1", targetType: "reply", targetId: "rp_005", websiteId: "w_002", reason: "harassment", additionalText: "Rude tone.", status: "dismissed", createdAt: daysAgo(12), updatedAt: daysAgo(11) },
];

// ─── Notifications (per user) ─────────────────────────────────────────────────
const N = (id, userId, title, message, link, isRead, daysBack) => ({
  _id: id, userId, title, message, link, isRead, createdAt: daysAgo(daysBack, 9),
});
const notifications = [
  N("n_001", "u_user1", "Developer replied", "Ravi Kumar replied to your review of TaskNest.", "/website/w_001?scroll=reviews", false, 1),
  N("n_002", "u_user1", "New from a developer you follow", "Meera Labs published a new website: PixelPerfect.", "/website/w_011", false, 2),
  N("n_003", "u_user1", "Ticket resolved", "Your support ticket “Cannot find my review” was resolved.", "/profile?section=support", true, 8),
  N("n_004", "u_dev1", "New review", "Demo User reviewed TaskNest (5★).", "/dev?tab=my-websites", false, 1),
  N("n_005", "u_dev1", "Website status", "ShipLog is awaiting admin approval.", "/dev?tab=my-websites", false, 3),
  N("n_006", "u_dev1", "Ticket received", "We received your ticket about ShipLog.", "/dev?tab=support", true, 2),
  N("n_007", "u_admin", "New developer request", "Aisha Khan requested developer access.", "/admin?tab=promotions", false, 1),
  N("n_008", "u_admin", "Website awaiting approval", "ShipLog and PixelPerfect are waiting for review.", "/admin?tab=approval", false, 1),
  N("n_009", "u_admin", "New report", "A review on BeatBox Studio was reported.", "/admin?tab=reports", false, 2),
];

const notificationPrefs = {
  user: { notificationsEnabled: true, followedDeveloper: true, newWebsitesDigest: true, reviewActivity: true, ticketsResolved: true },
  developer: { notificationsEnabled: true, websiteStatus: true, reviewsReceived: true, websiteReports: true, ticketsResolved: true },
  admin: { notificationsEnabled: true, userLifecycle: true, moderationQueue: true, support: true, contentActivity: true },
};

// ─── Audit logs (developer + admin) ───────────────────────────────────────────
const A = (id, userId, role, action, targetModel, details, daysBack, hour) => ({
  _id: id, userId, role, action, targetModel, details, createdAt: daysAgo(daysBack, hour),
});
const devAuditLogs = [
  A("al_001", "u_dev1", "developer", "DEV_WEBSITE_CREATED", "Website", { name: "ShipLog", category: "Developer Tools" }, 8, 11),
  A("al_002", "u_dev1", "developer", "DEV_WEBSITE_UPLOADED_ICON", "Website", { name: "ShipLog" }, 8, 11),
  A("al_003", "u_dev1", "developer", "DEV_WEBSITE_UPLOADED_SCREENSHOTS", "Website", { name: "ShipLog", count: 3 }, 8, 12),
  A("al_004", "u_dev1", "developer", "DEV_WEBSITE_UPDATED", "Website", { name: "TaskNest", fields: "description, tags" }, 14, 15),
  A("al_005", "u_dev1", "developer", "REPLY_CREATED", "Reply", { website: "TaskNest" }, 19, 9),
  A("al_006", "u_dev1", "developer", "REPLY_CREATED", "Reply", { website: "TaskNest" }, 14, 16),
  A("al_007", "u_dev1", "developer", "WISHLIST_ADDED", "Wishlist", { website: "PaletteLab" }, 6, 10),
  A("al_008", "u_dev1", "developer", "SUPPORT_TICKET_CREATED", "SupportTicket", { subject: "Website still pending" }, 2, 14),
  A("al_009", "u_dev1", "developer", "PROFILE_UPDATED", "User", { field: "name" }, 30, 9),
  A("al_010", "u_dev1", "developer", "DEVELOPER_APPLICATION_SUBMITTED", "PromotionRequest", { status: "approved" }, 200, 9),
];

const adminAuditLogs = [
  { _id: "aa_001", action: "WEBSITE_APPROVED", target: "TaskNest", admin: "Admin Root", status: "success", createdAt: daysAgo(58, 10), details: { websiteId: "w_001" } },
  { _id: "aa_002", action: "WEBSITE_REJECTED", target: "QuickInvoice", admin: "Admin Root", status: "warning", createdAt: daysAgo(5, 13), reason: "URL does not load a working page" },
  { _id: "aa_003", action: "USER_BANNED", target: "Liam Walker", admin: "Admin Root", status: "warning", createdAt: daysAgo(4, 16) },
  { _id: "aa_004", action: "PROMOTION_APPROVED", target: "Sam Carter", admin: "Admin Root", status: "success", createdAt: daysAgo(90, 9) },
  { _id: "aa_005", action: "REPORT_RESOLVED", target: "Review r_007", admin: "Admin Root", status: "success", createdAt: daysAgo(7, 12) },
  { _id: "aa_006", action: "TICKET_RESOLVED", target: "Screenshot upload fails", admin: "Admin Root", status: "success", createdAt: daysAgo(4, 15) },
  { _id: "aa_007", action: "REPORT_DISMISSED", target: "Reply rp_005", admin: "Admin Root", status: "success", createdAt: daysAgo(11, 10) },
  { _id: "aa_008", action: "REVIEW_HIDDEN", target: "Review r_013", admin: "Admin Root", status: "error", createdAt: daysAgo(2, 11), note: "Reverted after appeal" },
];

export const SEED = {
  users,
  websites,
  reviews,
  replies,
  wishlists,
  visited,
  follows,
  promotions,
  tickets,
  reports,
  notifications,
  notificationPrefs,
  devAuditLogs,
  adminAuditLogs,
};

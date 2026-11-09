import { useEffect, useState } from "react";
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Globe,
  ExternalLink,
} from "lucide-react";
import {
  getAllWebsites,
  getAllReviews,
  getAllReplies,
  hideReview,
  unhideReview,
  deleteReview,
  hideReply,
  unhideReply,
  deleteReply,
} from "../../../Services/Admin/rootService";
import Toast from "../../../Components/Common/Toast";

const LIMIT = 16; // multiple of 4 so the last grid row fills evenly

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(err, fallback) {
  const msg = err?.message;
  if (typeof msg === "string" && msg) return msg;
  if (msg && typeof msg === "object" && typeof msg.message === "string")
    return msg.message;
  return fallback;
}

// The axios interceptor already unwraps to response.data, so these calls
// resolve straight to the API body: { success, message, data }. Stay
// defensive about the exact key the list lives under.
function extractList(res, key) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d[key] ?? d.data ?? [];
}

// review.websiteId comes back POPULATED as { _id, name, url }, not a raw id
// — comparing it directly against a string id (via String(review.websiteId))
// produces "[object Object]" and never matches anything.
function getReviewWebsiteId(review) {
  const w = review?.websiteId;
  if (!w) return null;
  return typeof w === "object" ? w._id : w;
}

// Replies have NO websiteId field of their own at all — the only path to a
// website is through the (populated) parent review: reply.reviewId.websiteId.
// That nested websiteId is a plain string one level down, not populated further.
function getReplyWebsiteId(reply) {
  const review = reply?.reviewId;
  if (!review || typeof review !== "object") return null;
  return review.websiteId ?? null;
}

// isHidden can come back as the string "false" instead of the boolean false
// — "false" is truthy in JS, so raw `item.isHidden` checks silently invert.
function isHiddenBool(item) {
  return item?.isHidden === true || item?.isHidden === "true";
}

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-[#999] uppercase tracking-wide">
        {label}
      </p>
      <div className="text-[12px] text-[#333] break-words mt-0.5">
        {value ?? "—"}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  loading,
  onConfirm,
  onCancel,
}) {
  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#334155] hover:bg-[#293548]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5">
          <div
            className={`size-10 rounded-full flex items-center justify-center mb-3 ${tone === "danger" ? "bg-red-50" : "bg-[#f1f5f9]"}`}
          >
            <Trash2
              size={18}
              className={tone === "danger" ? "text-red-600" : "text-[#334155]"}
            />
          </div>
          <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">
            {title}
          </h3>
          <p className="text-[13px] text-[#666]">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white border-t border-[#e8ddd2]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-2 text-[12px] text-[#555] border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-3 py-2 text-[12px] text-white rounded-lg disabled:opacity-40 transition-colors ${confirmClasses}`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRow({ rating }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={
            i <= rounded
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

function WebsiteCard({ site, reviewCount, replyCount, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0 text-left hover:border-[#334155] transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="size-9 rounded-lg bg-[#f1f5f9] shrink-0 overflow-hidden flex items-center justify-center">
          {site.icon?.url ? (
            <img
              src={site.icon.url}
              alt={site.name}
              className="size-full object-cover"
            />
          ) : (
            <Globe size={16} className="text-[#334155]" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug truncate">
              {site.name}
            </p>
            <p className="text-[11px] text-[#999] truncate mt-0.5 capitalize">
              {site.category}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-auto pt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
              {reviewCount} review{reviewCount !== 1 ? "s" : ""}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#eef2ff] text-[#6366f1]">
              {replyCount} repl{replyCount !== 1 ? "ies" : "y"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ContentItem({ item, type, busy, onToggleHide, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8ddd2] p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
              type === "review"
                ? "bg-amber-50 text-amber-700"
                : "bg-[#eef2ff] text-[#6366f1]"
            }`}
          >
            {type === "review" ? "Review" : "Reply"}
          </span>
          {isHiddenBool(item) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 shrink-0">
              Hidden
            </span>
          )}
          <span className="text-[11px] text-[#999] truncate">
            {item.userId?.name || "—"}
          </span>
        </div>
        <span className="text-[10px] text-[#bbb] shrink-0">
          {formatDateTime(item.createdAt)}
        </span>
      </div>

      {type === "review" && item.rating != null && (
        <div className="mb-1.5">
          <StarRow rating={item.rating} />
        </div>
      )}

      <div className="space-y-1">
        {type === "review" ? (
          <>
            {item.design && (
              <p className="text-[12px] text-[#333] break-words">
                <span className="text-[#999]">Design:</span> {item.design}
              </p>
            )}
            {item.functionality && (
              <p className="text-[12px] text-[#333] break-words">
                <span className="text-[#999]">Functionality:</span>{" "}
                {item.functionality}
              </p>
            )}
            {item.performance && (
              <p className="text-[12px] text-[#333] break-words">
                <span className="text-[#999]">Performance:</span>{" "}
                {item.performance}
              </p>
            )}
            {item.additionalComments && (
              <p className="text-[12px] text-[#333] break-words">
                {item.additionalComments}
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px] text-[#333] break-words">{item.comment}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={() => onToggleHide(item, type)}
          disabled={busy}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg text-[#334155] hover:bg-[#f1f5f9] disabled:opacity-40 transition-colors"
        >
          {isHiddenBool(item) ? <Eye size={12} /> : <EyeOff size={12} />}
          {isHiddenBool(item) ? "Unhide" : "Hide"}
        </button>
        <button
          onClick={() => onDelete(item, type)}
          disabled={busy}
          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

function WebsiteContentModal({
  site,
  reviews,
  replies,
  onClose,
  onChanged,
  onToast,
}) {
  const [items, setItems] = useState(() =>
    [
      ...reviews.map((r) => ({ ...r, __type: "review" })),
      ...replies.map((r) => ({ ...r, __type: "reply" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  );
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // { item, type } | null

  async function handleToggleHide(item, type) {
    setBusyId(item._id);
    try {
      const wasHidden = isHiddenBool(item);
      if (type === "review") {
        await (wasHidden ? unhideReview(item._id) : hideReview(item._id));
      } else {
        await (wasHidden ? unhideReply(item._id) : hideReply(item._id));
      }
      setItems((list) =>
        list.map((it) =>
          it._id === item._id ? { ...it, isHidden: !wasHidden } : it,
        ),
      );
      onToast(wasHidden ? "Unhidden" : "Hidden");
      onChanged();
    } catch (err) {
      onToast(getErrorMessage(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const { item, type } = pendingDelete;
    setBusyId(item._id);
    try {
      await (type === "review"
        ? deleteReview(item._id)
        : deleteReply(item._id));
      setItems((list) => list.filter((it) => it._id !== item._id));
      onToast("Deleted");
      onChanged();
    } catch (err) {
      onToast(getErrorMessage(err, "Delete failed"));
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
            <h2 className="font-semibold text-[#1a1a1a] text-base">
              Reviews & Replies
            </h2>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* ── Left: website details ── */}
              <div className="space-y-4 md:sticky md:top-0">
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="size-12 rounded-xl bg-[#f1f5f9] shrink-0 overflow-hidden flex items-center justify-center">
                      {site.icon?.url ? (
                        <img
                          src={site.icon.url}
                          alt={site.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Globe size={22} className="text-[#334155]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#1a1a1a] break-words">
                        {site.name}
                      </p>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#334155] flex items-center gap-1 hover:underline break-all"
                      >
                        {site.url}{" "}
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <DetailRow
                      label="Category"
                      value={
                        <span className="capitalize">{site.category}</span>
                      }
                    />
                    <DetailRow
                      label="Status"
                      value={<span className="capitalize">{site.status}</span>}
                    />
                    <DetailRow label="Owner" value={site.ownerName} />
                    <DetailRow
                      label="Visitors"
                      value={(site.uniqueVisitors ?? 0).toLocaleString()}
                    />
                  </div>

                  {site.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {site.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[#f1f5f9] text-[#555] px-2 py-0.5 rounded-full capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[13px] text-[#333] whitespace-pre-wrap break-words">
                    {site.description}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-3">
                    <Star size={12} /> Rating Summary
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-[#1a1a1a]">
                      {site.averageRating > 0
                        ? Number(site.averageRating).toFixed(1)
                        : "0.0"}
                    </span>
                    <div>
                      <StarRow rating={site.averageRating} />
                      <p className="text-[11px] text-[#999] mt-1">
                        Based on{" "}
                        {items.filter((i) => i.__type === "review").length}{" "}
                        review
                        {items.filter((i) => i.__type === "review").length !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: reviews & replies with moderation actions ── */}
              <div>
                {items.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#e8ddd2] p-6 text-center">
                    <p className="text-[12px] text-[#bbb]">
                      No reviews or replies for this website yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <ContentItem
                        key={item._id}
                        item={item}
                        type={item.__type}
                        busy={busyId === item._id}
                        onToggleHide={handleToggleHide}
                        onDelete={(i, type) =>
                          setPendingDelete({ item: i, type })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete this ${pendingDelete.type}?`}
          message="This permanently removes the content. This cannot be undone."
          confirmLabel="Delete"
          tone="danger"
          loading={busyId === pendingDelete.item._id}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}

export default function AdminReviewsReplies() {
  const [page, setPage] = useState(1);
  const [websites, setWebsites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [openSite, setOpenSite] = useState(null);

  // Reviews/replies endpoints don't take a websiteId filter, so everything
  // is fetched once and grouped client-side per website — same "fetch all,
  // filter locally" pattern used in AdminBrowseWebsites/AdminDevelopers.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [sitesRes, reviewsRes, repliesRes] = await Promise.all([
          getAllWebsites({ limit: 1000 }),
          getAllReviews(),
          getAllReplies(),
        ]);
        if (cancelled) return;
        setWebsites(extractList(sitesRes, "websites"));
        setReviews(extractList(reviewsRes, "reviews"));
        setReplies(extractList(repliesRes, "replies"));
      } catch (err) {
        if (!cancelled) {
          setToastMessage(
            getErrorMessage(err, "Failed to load reviews & replies"),
          );
          setWebsites([]);
          setReviews([]);
          setReplies([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadIndex]);

  // Only show websites that actually have review/reply activity.
  const sitesWithContent = websites
    .map((site) => {
      const siteReviews = reviews.filter(
        (r) => String(getReviewWebsiteId(r)) === String(site._id),
      );
      const siteReplies = replies.filter(
        (r) => String(getReplyWebsiteId(r)) === String(site._id),
      );
      return { site, siteReviews, siteReplies };
    })
    .filter(
      ({ siteReviews, siteReplies }) =>
        siteReviews.length > 0 || siteReplies.length > 0,
    );

  const totalPages = Math.max(1, Math.ceil(sitesWithContent.length / LIMIT));
  const pageItems = sitesWithContent.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">
            Reviews & Replies
          </h2>
        </div>
        <button
          onClick={() => setReloadIndex((i) => i + 1)}
          className="flex items-center gap-1 text-[12px] text-[#334155] hover:underline"
        >
          <RefreshCcw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#bbb] text-center py-10">Loading…</p>
      ) : sitesWithContent.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No websites have reviews or replies yet
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {pageItems.map(({ site, siteReviews, siteReplies }) => (
            <WebsiteCard
              key={site._id}
              site={site}
              reviewCount={siteReviews.length}
              replyCount={siteReplies.length}
              onOpen={() => setOpenSite({ site, siteReviews, siteReplies })}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="size-8 rounded-lg border border-[#e8ddd2] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5efe6]"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-[#888]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="size-8 rounded-lg border border-[#e8ddd2] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5efe6]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {openSite && (
        <WebsiteContentModal
          site={openSite.site}
          reviews={openSite.siteReviews}
          replies={openSite.siteReplies}
          onClose={() => setOpenSite(null)}
          onChanged={() => setReloadIndex((i) => i + 1)}
          onToast={setToastMessage}
        />
      )}
    </div>
  );
}

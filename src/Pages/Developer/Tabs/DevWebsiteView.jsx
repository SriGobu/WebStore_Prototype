import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import {
  getWebsiteById,
  renderAllWebsites,
  incrementVisitCount,
  getVisitedWebsites,
} from "../../../Services/User/websiteService";
import { ShieldCheck, Users, ExternalLink, Bookmark } from "lucide-react";
import {
  renderAllReviews,
  createReview,
  updateReview,
  deleteReview,
  getRepliesByReview,
} from "../../../Services/Developer/reviewService";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../../../Services/Developer/wishlistService";
import { reportWebsite } from "../../../Services/Common/reportService";
import ReportModal from "../../../Components/Common/ReportModal";
import ReviewCard from "../../../Components/User/ReviewCard";
import DevReplyCard from "../../../Components/Developer/DevReplyCard";
import DevPublisherLink from "../../../Components/Developer/DevPublisherLink";
import SimilarWebsites from "../../../Components/User/SimilarWebsites";
import MoreByPublisher from "../../../Components/User/MoreByPublisher";
import OptionsMenu from "../../../Components/Common/OptionsMenu";
import ScreenshotViewer from "../../../Components/Common/ScreenshotViewer";
import Toast from "../../../Components/Common/Toast";
import useAuthStore from "../../../Store/authStore";

const QUESTIONS = [
  { key: "design", label: "Is the website beautiful and easy to navigate?" },
  {
    key: "functionality",
    label: "Does the website actually do what it promises?",
  },
  { key: "performance", label: "Does the site load quickly or is it laggy?" },
];

function emptyForm() {
  return {
    rating: 0,
    design: "",
    functionality: "",
    performance: "",
    designSkipped: false,
    functionalitySkipped: false,
    performanceSkipped: false,
    additionalComments: "",
  };
}

function ScreenshotScroller({
  screenshots,
  activeScreenshot,
  setActiveScreenshot,
  onOpenViewer,
}) {
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const didDrag = useRef(false);

  function onMouseDown(e) {
    isDragging.current = true;
    didDrag.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  }
  function onMouseMove(e) {
    if (!isDragging.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) didDrag.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }
  function onMouseUp() {
    isDragging.current = false;
    scrollRef.current.style.cursor = "grab";
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="flex gap-4 overflow-x-auto pb-4 select-none cursor-grab"
      style={{ scrollbarWidth: "none" }}
    >
      {screenshots.map((shot, i) => (
        <div
          key={shot._id}
          onClick={() => {
            if (!didDrag.current) {
              setActiveScreenshot(i);
              onOpenViewer();
            }
          }}
          className={`rounded-xl w-[calc(33.333%-11px)] min-w-[280px] h-[200px] shrink-0 overflow-hidden border-2 transition-colors ${
            activeScreenshot === i ? "border-[#c4956a]" : "border-transparent"
          }`}
        >
          <img
            src={shot.url}
            alt={`screenshot ${i + 1}`}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>
      ))}
    </div>
  );
}

export default function DevWebsiteView({
  websiteId,
  onBack,
  onNavigate,
  onPublisherClick,
}) {
  const { user } = useAuthStore();

  const [website, setWebsite] = useState(null);
  const [allWebsites, setAllWebsites] = useState([]);
  const [review, setReview] = useState(null);
  const [replies, setReplies] = useState({});
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [hasVisitedSession, setHasVisitedSession] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [hoverRating, setHoverRating] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  // ── Report website ─────────────────────────────────────────────────────────
  const [showReport, setShowReport] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!websiteId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setWebsite(null);
      setReview(null);
      setActiveScreenshot(0);
      try {
        const [websiteRes, visitedRes, reviewRes, allRes, wishlistRes] =
          await Promise.all([
            getWebsiteById(websiteId),
            getVisitedWebsites(),
            renderAllReviews(websiteId),
            renderAllWebsites(),
            getWishlist(),
          ]);
        if (cancelled) return;

        const site = websiteRes.data.website;
        const reviewList = reviewRes.data.reviews ?? [];
        const wishlist =
          wishlistRes.data.websites ?? wishlistRes.data.wishlist ?? [];

        setWebsite(site);
        setReview(reviewList);
        setAllWebsites(allRes.data.websites ?? []);
        setCanReview(
          visitedRes.data.websites?.some((w) => w._id === site._id) ?? false,
        );
        setIsWishlisted(wishlist.some((w) => w._id === site._id));
        await loadReplies(reviewList, () => cancelled);
      } catch (err) {
        if (!cancelled)
          setToastMessage(err.message || "Failed to load website");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [websiteId]);

  async function loadReplies(reviewList, isCancelled) {
    const entries = await Promise.all(
      reviewList.map(async (r) => {
        try {
          const res = await getRepliesByReview(r._id);
          return [r._id, (res.data?.replies ?? []).filter(Boolean)];
        } catch {
          return [r._id, []];
        }
      }),
    );
    if (!isCancelled()) setReplies(Object.fromEntries(entries));
  }

  async function refreshReviews() {
    const res = await renderAllReviews(websiteId);
    const reviewList = res.data.reviews ?? [];
    setReview(reviewList);
    await loadReplies(reviewList, () => false);
  }

  async function handleVisit() {
    if (hasVisitedSession) return;
    try {
      await incrementVisitCount(website._id);
      setHasVisitedSession(true);
      setCanReview(true);
      const res = await getWebsiteById(website._id);
      setWebsite(res.data.website);
    } catch (err) {
      setToastMessage(err.message || "Failed to register visit");
    }
  }

  async function handleToggleWishlist() {
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(website._id);
      } else {
        await addToWishlist(website._id);
      }
      const res = await getWishlist();
      const wishlist = res.data.websites ?? res.data.wishlist ?? [];
      setIsWishlisted(wishlist.some((w) => w._id === website._id));
    } catch (err) {
      setToastMessage(err.message || "Wishlist update failed");
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!formValid) return;
    try {
      const payload = { rating: form.rating };
      if (!form.designSkipped) payload.design = form.design;
      if (!form.functionalitySkipped)
        payload.functionality = form.functionality;
      if (!form.performanceSkipped) payload.performance = form.performance;
      if (form.additionalComments.trim())
        payload.additionalComments = form.additionalComments;
      await createReview(website._id, payload);
      await refreshReviews();
      setModalMode(null);
      setHoverRating(0);
    } catch (err) {
      setToastMessage(err.message || "Review submit failed");
    }
  }

  async function handleEditReview(editForm) {
    try {
      const payload = { rating: editForm.rating };
      if (!editForm.designSkipped) payload.design = editForm.design;
      if (!editForm.functionalitySkipped)
        payload.functionality = editForm.functionality;
      if (!editForm.performanceSkipped)
        payload.performance = editForm.performance;
      if (editForm.additionalComments?.trim())
        payload.additionalComments = editForm.additionalComments;
      await updateReview(website._id, payload);
      await refreshReviews();
    } catch (err) {
      setToastMessage(err.message || "Edit failed");
      throw err;
    }
  }

  async function handleDeleteReview() {
    try {
      await deleteReview(website._id);
      await refreshReviews();
    } catch (err) {
      setToastMessage(err.message || "Delete failed");
    }
  }

  async function handleReport(payload) {
    setReporting(true);
    try {
      await reportWebsite(website._id, payload);
      setAlreadyReported(true);
      setShowReport(false);
      setToastMessage("Website reported successfully.");
    } catch (err) {
      setToastMessage(err.message || "Failed to report website.");
    } finally {
      setReporting(false);
    }
  }

  const reviews = review ?? [];
  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage =
      totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars: star, percentage };
  });

  const currentUserId = user?._id ?? user?.id;
  const userAlreadyReviewed = reviews.some(
    (r) => String(r.userId?._id) === String(currentUserId),
  );

  const formValid =
    form.rating > 0 &&
    (form.designSkipped || form.design.trim().length > 0) &&
    (form.functionalitySkipped || form.functionality.trim().length > 0) &&
    (form.performanceSkipped || form.performance.trim().length > 0);

  const similarWebsitesList = website
    ? allWebsites.filter(
        (s) => s._id !== website._id && s.category === website.category,
      )
    : [];

  const moreByDeveloperList = website?.ownerName
    ? allWebsites.filter(
        (s) => s._id !== website._id && s.ownerName === website.ownerName,
      )
    : [];

  const hasSidebar =
    similarWebsitesList.length > 0 || moreByDeveloperList.length > 0;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!website)
    return (
      <div className="text-center py-16">
        <p className="text-[#888] text-sm mb-3">Website not found.</p>
        <button
          onClick={onBack}
          className="text-[#c4956a] text-sm hover:underline"
        >
          ← Back to Browse
        </button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-[#888] hover:text-[#c4956a] transition-colors"
      >
        <ArrowLeft size={15} /> Back to Browse
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#bbb]">
        <span>Browse</span>
        <span>›</span>
        <span className="capitalize">{website.category}</span>
        <span>›</span>
        <span className="text-[#888]">{website.name}</span>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 ${hasSidebar ? "lg:grid-cols-3" : ""}`}
      >
        {/* Main column */}
        <div className={`${hasSidebar ? "lg:col-span-2" : ""} space-y-6`}>
          {/* App Header Card */}
          <div className="bg-[#fafafa] rounded-xl shadow-lg p-5 sm:p-6 relative">
            {/* Options Menu — Responsive absolute positioning */}
            {/* Mobile: Top-Left | Desktop (md): Top-Right */}
            <div className="absolute top-1 left-1 md:left-auto md:right-1 z-20">
              <OptionsMenu
                items={[
                  {
                    label: alreadyReported
                      ? "Already Reported"
                      : "Report Website",
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        className="fill-none stroke-current"
                        style={{ strokeWidth: 2 }}
                      >
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                    ),
                    onClick: () => setShowReport(true),
                    disabled: alreadyReported,
                    danger: !alreadyReported,
                  },
                ]}
              />
            </div>

            {/* Main Info Section */}
            {/* Mobile: Icon Left, Details Right | Desktop: Details Left, Icon Right (Vertically Centered) */}
            <div className="grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto] gap-4 sm:gap-6 items-start md:items-center pt-2 sm:pt-0">
              {/* Details Column */}
              {/* Mobile: order-last (right side) | Desktop: order-first (left side) */}
              <div className="min-w-0 space-y-2 sm:space-y-3 order-last md:order-first">
                <div>
                  <h1 className="font-bold text-[#111] text-xl sm:text-4xl mb-0.5 truncate">
                    {website.name}
                  </h1>

                  <DevPublisherLink
                    ownerName={website.ownerName}
                    fallback={website.category}
                    onNavigate={(ownerName) => onPublisherClick?.(ownerName)}
                  />
                </div>

                {/* Tags (Desktop view) */}
                <div className="hidden sm:flex flex-wrap gap-2">
                  {website.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#f5efe6] border border-[#e0d9d0] px-3 py-1 rounded-xl text-[#767676] text-xs capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Metrics Sub-row (Desktop placement) */}
                <div className="hidden sm:flex items-center gap-5 text-[#767676] pt-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-[#389e61]" />
                    <span className="text-sm font-semibold text-[#389e61]">
                      Verified Secure
                    </span>
                  </div>
                  <div className="h-4 w-[1px] bg-[#e0d9d0]" />
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-[#767676]" />
                    <span className="text-sm font-bold text-[#111]">
                      {website.uniqueVisitors ?? "0"}
                    </span>
                    <span className="text-sm font-normal text-[#767676]">
                      Visits
                    </span>
                  </div>
                </div>
              </div>

              {/* Icon Column */}
              {/* Mobile: order-first (left side) | Desktop: order-last (right side + slightly larger) */}
              <div className="shrink-0 order-first md:order-last">
                <div className="rounded-[22px] sm:rounded-[30px] size-20 sm:size-32 md:size-36 overflow-hidden border border-[#e0d9d0]/50 shadow-sm transition-all">
                  <img
                    src={website.icon.url}
                    alt={website.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Tags Breakdown (Mobile layout version) */}
            <div className="flex sm:hidden flex-wrap gap-1.5 mt-4">
              {website.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#f5efe6] border border-[#e0d9d0] px-2.5 py-0.5 rounded-lg text-[#767676] text-[11px] capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Metrics Sub-row (Mobile placement) */}
            <div className="flex sm:hidden items-center gap-5 mt-4 text-[#767676] px-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4.5 text-[#389e61]" />
                <span className="text-xs font-semibold text-[#389e61]">
                  Verified Secure
                </span>
              </div>
              <div className="h-3.5 w-[1px] bg-[#e0d9d0]" />
              <div className="flex items-center gap-2">
                <Users className="size-4.5 text-[#767676]" />
                <span className="text-xs font-bold text-[#111]">
                  {website.uniqueVisitors ?? "0"}
                </span>
                <span className="text-xs font-normal text-[#767676]">
                  Visits
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="mt-2 border-t border-dashed border-[#e0d9d0]/60 sm:border-none sm:pt-4 flex gap-2.5 w-full sm:justify-start">
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleVisit}
                className="bg-[#f5efe6] border border-[#e0d9d0] px-8 py-2.5 rounded-xl text-[#111] text-sm font-medium hover:bg-[#e8dfd4] transition-colors flex-1 sm:flex-initial flex items-center justify-center gap-1.5 min-w-[110px]"
              >
                <ExternalLink className="size-4" />
                Visit
              </a>

              <button
                onClick={() => handleToggleWishlist()}
                disabled={wishlistLoading}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors border flex-1 sm:flex-initial flex items-center justify-center gap-1.5 min-w-[120px] ${
                  isWishlisted
                    ? "bg-[#c4956a] border-[#c4956a] text-white hover:bg-[#b08560]"
                    : "bg-[#f5efe6] border-[#e0d9d0] text-[#111] hover:bg-[#e8dfd4]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Bookmark
                  className={`size-4 ${isWishlisted ? "fill-current" : ""}`}
                />
                {wishlistLoading ? "..." : isWishlisted ? "Saved" : "Wishlist"}
              </button>
            </div>
          </div>

          {/* Screenshots */}
          {website.screenshots?.length > 0 && (
            <ScreenshotScroller
              screenshots={website.screenshots}
              activeScreenshot={activeScreenshot}
              setActiveScreenshot={setActiveScreenshot}
              onOpenViewer={() => setViewerOpen(true)} // NEW
            />
          )}

          {viewerOpen && (
            <ScreenshotViewer
              screenshots={website.screenshots}
              activeIndex={activeScreenshot}
              onChangeIndex={setActiveScreenshot}
              onClose={() => setViewerOpen(false)}
            />
          )}

          {/* About */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-6">
            <h2 className="font-semibold text-[#1a1a1a] text-base mb-4 pb-4 border-b border-[#e8ddd2]">
              About this website
            </h2>
            <p className="text-[#444] text-sm leading-relaxed whitespace-pre-line">
              {website.description}
            </p>
          </div>

          {/* Ratings & Reviews */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1a1a1a] text-base">
                Ratings & Reviews
              </h2>
              {canReview && !userAlreadyReviewed && (
                <button
                  onClick={() => {
                    setForm(emptyForm());
                    setModalMode("write");
                  }}
                  className="bg-[#c4956a] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#b08560] transition-colors"
                >
                  Write a Review
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-[#e8ddd2] mb-6">
              <div className="flex flex-col">
                <span className="font-bold text-[#1a1a1a] text-6xl">
                  {averageRating}
                </span>
                <span className="text-[#999] text-xs">out of 5</span>
              </div>
              <div className="flex-1 space-y-2">
                {ratingDistribution.map(({ stars, percentage }) => (
                  <div key={stars} className="flex items-center gap-4">
                    <span className="text-[#999] text-xs w-3">{stars}</span>
                    <div className="flex-1 bg-[#f5efe6] rounded h-2 overflow-hidden">
                      <div
                        className="bg-[#c4956a] h-full rounded"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[#999] text-xs w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id}>
                    <ReviewCard
                      review={rev}
                      currentUser={user}
                      onEdit={handleEditReview}
                      onDelete={handleDeleteReview}
                      replies={[]}
                      QUESTIONS={QUESTIONS}
                    />
                    <DevReplyCard
                      reviewId={rev._id}
                      replies={replies[rev._id] ?? []}
                      currentUser={user}
                      isWebsiteOwner={
                        website?.ownerId === (user?._id ?? user?.id) ||
                        website?.ownerId?.toString() ===
                          (user?._id ?? user?.id)?.toString()
                      }
                      onRepliesChange={refreshReviews}
                    />
                  </div>
                ))
              ) : (
                <p className="text-[#bbb] text-sm text-center py-8">
                  No reviews yet.{" "}
                  {canReview
                    ? "Be the first to review!"
                    : "Visit the website to write a review."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {hasSidebar && (
          <div className="space-y-6">
            <SimilarWebsites
              currentWebsite={website}
              allWebsites={allWebsites}
              onNavigate={(id) => onNavigate?.(id)}
            />
            <MoreByPublisher
              currentWebsite={website}
              allWebsites={allWebsites}
              onNavigate={(id) => onNavigate?.(id)}
            />
          </div>
        )}
      </div>

      {/* Review modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
          <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative my-auto">
            <button
              onClick={() => {
                setModalMode(null);
                setHoverRating(0);
              }}
              className="absolute top-4 right-4 text-[#767676] hover:text-[#111] text-2xl leading-none"
            >
              ×
            </button>

            <h3 className="font-semibold text-[#111] text-lg mb-1">
              Write a Review
            </h3>
            <p className="text-[#767676] text-xs mb-5">{website.name}</p>

            <p className="text-sm text-[#333] mb-2 font-medium">
              Overall rating <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                  className="text-3xl transition-colors"
                  style={{
                    color:
                      star <= (hoverRating || form.rating)
                        ? "#c4956a"
                        : "#e0d9d0",
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            {QUESTIONS.map(({ key, label }) => {
              const skippedKey = `${key}Skipped`;
              const isSkipped = form[skippedKey];
              return (
                <div key={key} className="mb-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-[#333] font-medium leading-snug">
                      {label} <span className="text-red-500">*</span>
                    </p>
                    <button
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          [skippedKey]: !isSkipped,
                          [key]: isSkipped ? f[key] : "",
                        }))
                      }
                      className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                        isSkipped
                          ? "bg-[#c4956a] text-white border-[#c4956a]"
                          : "bg-[#f5efe6] text-[#767676] border-[#e0d9d0] hover:border-[#c4956a] hover:text-[#c4956a]"
                      }`}
                    >
                      {isSkipped ? "Undo Skip" : "Skip"}
                    </button>
                  </div>
                  {isSkipped ? (
                    <div className="bg-[#f5efe6] border border-dashed border-[#c4956a] rounded-xl px-4 py-3 flex items-center gap-2">
                      <span className="text-[#c4956a] text-sm">—</span>
                      <p className="text-sm text-[#b0a898] italic">
                        Question skipped
                      </p>
                    </div>
                  ) : (
                    <textarea
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#b0a898] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
                    />
                  )}
                </div>
              );
            })}

            <div className="mb-5">
              <p className="text-sm text-[#333] mb-2 font-medium">
                Anything else?{" "}
                <span className="text-[#767676] font-normal">(optional)</span>
              </p>
              <textarea
                value={form.additionalComments}
                onChange={(e) =>
                  setForm((f) => ({ ...f, additionalComments: e.target.value }))
                }
                placeholder="Share a personal tip or note for other users..."
                rows={3}
                className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#b0a898] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalMode(null);
                  setHoverRating(0);
                }}
                className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!formValid}
                className="flex-1 bg-[#c4956a] py-2 rounded-xl font-semibold text-white text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {showReport && (
        <ReportModal
          targetType="website"
          targetName={website.name}
          onSubmit={handleReport}
          onClose={() => setShowReport(false)}
          submitting={reporting}
        />
      )}
    </div>
  );
}

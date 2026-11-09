import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  ShieldCheck,
  Users,
  Activity,
  Star,
  MessageSquare,
} from "lucide-react";
import Toast from "../../../Components/Common/Toast";
import WebsiteCard from "../../../Components/Admin/WebsiteCard";
import CategoryPills from "../../../Components/User/CategoryPills";
import SimilarWebsites from "../../../Components/User/SimilarWebsites";
import MoreByPublisher from "../../../Components/User/MoreByPublisher";
import api from "../../../Config/axios";
import {
  getUniqueCategories,
  filterByCategory,
} from "../../../Utils/categoryUtils";
import { searchWebsites } from "../../../Utils/searchUtils";
import ScreenshotViewer from "../../../Components/Common/ScreenshotViewer";

// ─── Publisher label (no navigate — filters grid instead) ─────────────────────

function AdminPublisherLabel({ ownerName, fallback, onFilter, className }) {
  if (!ownerName) {
    return (
      <p className={className ?? "text-[#767676] text-sm mb-4"}>{fallback}</p>
    );
  }
  return (
    <button
      onClick={() => onFilter?.(ownerName)}
      className={
        className ??
        "text-[#767676] text-sm mb-4 hover:text-[#334155] hover:underline transition-colors text-left"
      }
    >
      {ownerName}
    </button>
  );
}

// ─── Screenshot scroller ──────────────────────────────────────────────────────

function ScreenshotScroller({ screenshots, active, setActive, onOpenViewer }) {
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
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 5) didDrag.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }
  function onMouseUp() {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
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
          key={shot._id ?? i}
          onClick={() => {
            if (!didDrag.current) {
              setActive(i);
              onOpenViewer();
            }
          }}
          className={`rounded-xl w-[calc(33.333%-11px)] min-w-[280px] h-[200px] shrink-0 overflow-hidden border-2 transition-colors ${
            active === i ? "border-[#334155]" : "border-transparent"
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

// ─── Website detail view ──────────────────────────────────────────────────────
function AdminWebsiteView({
  websiteId,
  allWebsites,
  onBack,
  onNavigate,
  onPublisherFilter,
}) {
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!websiteId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setWebsite(null);
      setActiveScreenshot(0);
      try {
        // Only admin endpoint — never call user routes with admin token
        const res = await api.get(`/admin/websites/${websiteId}`);
        if (cancelled) return;
        const site = res?.data?.website ?? res?.website ?? res;
        setWebsite(site);
      } catch (err) {
        if (!cancelled)
          setToastMessage(err?.message || "Failed to load website");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [websiteId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="inline-block w-6 h-6 border-2 border-[#334155] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!website)
    return (
      <div className="text-center py-16">
        <p className="text-[#888] text-sm mb-3">Website not found.</p>
        <button
          onClick={onBack}
          className="text-[#334155] text-sm hover:underline"
        >
          ← Back to Browse
        </button>
      </div>
    );

  // Use averageRating and totalReviews from the website object directly
  const averageRating =
    (website.averageRating ?? 0) > 0
      ? Number(website.averageRating).toFixed(1)
      : "0.0";

  const totalReviews = website.totalReviews ?? 0;

  const similarList = allWebsites.filter(
    (s) => s._id !== website._id && s.category === website.category,
  );
  const moreByList = allWebsites.filter(
    (s) => s._id !== website._id && s.ownerName === website.ownerName,
  );
  const hasSidebar = similarList.length > 0 || moreByList.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] text-[#888] hover:text-[#334155] transition-colors"
      >
        <ArrowLeft size={15} /> Back to Browse
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#bbb]">
        <span>Browse</span>
        <span>›</span>
        <span className="capitalize">{website.category}</span>
        <span>›</span>
        <span className="text-[#555]">{website.name}</span>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 ${hasSidebar ? "lg:grid-cols-3" : ""}`}
      >
        {/* Main column */}
        <div className={`${hasSidebar ? "lg:col-span-2" : ""} space-y-6`}>
          {/* App header */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-5 sm:p-6">
            {/* Mobile: [auto_1fr] → icon col1 (left), details col2 (right) */}
            {/* Desktop: [1fr_auto] → details col1 (left), icon col2 (right) */}
            <div className="grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto] gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
              {/* Icon — mobile: top-left corner, row 1 only | desktop: right side, spans all rows, vertically centered */}
              <div className="col-start-1 md:col-start-2 row-start-1 md:row-span-4 self-start md:self-center shrink-0">
                <div className="rounded-2xl md:rounded-[30px] size-16 sm:size-20 md:size-28 overflow-hidden bg-[#f1f5f9] border border-[#e8ddd2] flex items-center justify-center">
                  {website.icon?.url ? (
                    <img
                      src={website.icon.url}
                      alt={website.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Globe className="size-6 sm:size-7 md:size-9 text-[#334155]" />
                  )}
                </div>
              </div>

              {/* Row 1: Name + publisher label */}
              <div className="col-start-2 md:col-start-1 row-start-1 min-w-0 flex flex-col justify-center">
                <h1 className="font-bold text-[#1a1a1a] text-xl sm:text-2xl md:text-3xl mb-1 truncate">
                  {website.name}
                </h1>
                <AdminPublisherLabel
                  ownerName={website.ownerName}
                  fallback={website.category}
                  onFilter={(name) => {
                    onPublisherFilter(name);
                    onBack();
                  }}
                />
              </div>

              {/* Row 2: Tags — full width across both columns on mobile */}
              <div className="col-span-2 md:col-span-1 md:col-start-1 row-start-2 flex flex-wrap gap-2">
                {website.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#f1f5f9] border border-[#e8ddd2] px-3 py-1 rounded-xl text-[#767676] text-xs capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Row 3: Metrics — inline icon/label style with dividers */}
              <div className="col-span-2 md:col-span-1 md:col-start-1 row-start-3 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-[#767676]">
                {website.isSecure && (
                  <>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <ShieldCheck className="size-4 sm:size-4.5 text-emerald-600" />
                      <span className="text-xs sm:text-sm font-semibold text-emerald-600">
                        Verified Secure
                      </span>
                    </div>
                    <div className="h-3.5 w-[1px] bg-[#e8ddd2]" />
                  </>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="size-4 sm:size-4.5 text-[#767676]" />
                  <span className="text-xs sm:text-sm font-bold text-[#111]">
                    {website.uniqueVisitors ?? "0"}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-[#767676]">
                    Visits
                  </span>
                </div>

                <div className="h-3.5 w-[1px] bg-[#e8ddd2]" />

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Activity
                    className={`size-4 sm:size-4.5 ${
                      website.status === "active"
                        ? "text-emerald-600"
                        : website.status === "pending"
                          ? "text-amber-600"
                          : "text-red-500"
                    }`}
                  />
                  <span
                    className={`text-xs sm:text-sm font-bold capitalize ${
                      website.status === "active"
                        ? "text-emerald-600"
                        : website.status === "pending"
                          ? "text-amber-600"
                          : "text-red-500"
                    }`}
                  >
                    {website.status}
                  </span>
                </div>

                <div className="h-3.5 w-[1px] bg-[#e8ddd2]" />

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Star className="size-4 sm:size-4.5 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-[#111]">
                    {averageRating}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-[#767676]">
                    Rating
                  </span>
                </div>

                <div className="h-3.5 w-[1px] bg-[#e8ddd2]" />

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MessageSquare className="size-4 sm:size-4.5 text-[#767676]" />
                  <span className="text-xs sm:text-sm font-bold text-[#111]">
                    {totalReviews}
                  </span>
                  <span className="text-xs sm:text-sm font-normal text-[#767676]">
                    Reviews
                  </span>
                </div>
              </div>

              {/* Row 4: Button — full width across both columns on mobile */}
              <div className="col-span-2 md:col-span-1 md:col-start-1 row-start-4">
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#f1f5f9] border border-[#e8ddd2] px-6 py-2 rounded-xl text-[#334155] text-sm hover:bg-[#e2e8f0] transition-colors"
                >
                  Visit Website <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* Screenshots */}
          {website.screenshots?.length > 0 && (
            <ScreenshotScroller
              screenshots={website.screenshots}
              active={activeScreenshot}
              setActive={setActiveScreenshot}
              onOpenViewer={() => setViewerOpen(true)}
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

          {/* Rating summary — from website object, no review fetching */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-6">
            <h2 className="font-semibold text-[#1a1a1a] text-base mb-4">
              Rating Summary
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="font-bold text-[#1a1a1a] text-6xl">
                  {averageRating}
                </span>
                <span className="text-[#999] text-xs">out of 5</span>
              </div>
              <div>
                <p className="text-[13px] text-[#555]">
                  Based on{" "}
                  <span className="font-semibold text-[#1a1a1a]">
                    {totalReviews}
                  </span>{" "}
                  review{totalReviews !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-[#999] mt-1">
                  Go to{" "}
                  <span className="font-medium text-[#334155]">
                    Reviews & Replies
                  </span>{" "}
                  tab to manage individual reviews.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {hasSidebar && (
          <div className="space-y-6">
            <SimilarWebsites
              currentWebsite={website}
              allWebsites={allWebsites}
              onNavigate={(id) => onNavigate(id)}
            />
            <MoreByPublisher
              currentWebsite={website}
              allWebsites={allWebsites}
              onNavigate={(id) => onNavigate(id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Browse component ────────────────────────────────────────────────────

export default function AdminBrowseWebsites() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [publisherFilter, setPublisherFilter] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // interceptor returns response.data directly
        const res = await api.get("/admin/websites", {
          params: { limit: 1000 },
        });
        const list = res?.data?.websites ?? res?.websites ?? res?.data ?? [];
        if (!cancelled) setWebsites(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled)
          setToastMessage(err?.message || "Failed to load websites");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Filters ──────────────────────────────────────────────────────────────
  const categories = getUniqueCategories(websites);

  const searched = search.trim() ? searchWebsites(websites, search) : websites;

  const byCategory = filterByCategory(searched, selectedCategory);

  const filteredApps = publisherFilter
    ? byCategory.filter((w) => w.ownerName === publisherFilter)
    : byCategory;

  function handlePublisherFilter(name) {
    setPublisherFilter(name);
    setSelectedId(null);
    setSelectedCategory("All");
    setSearch("");
  }

  // ── Detail view ────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <AdminWebsiteView
        websiteId={selectedId}
        allWebsites={websites}
        onBack={() => setSelectedId(null)}
        onNavigate={(id) => setSelectedId(id)}
        onPublisherFilter={handlePublisherFilter}
      />
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-[#1a1a1a] text-xl">
            {publisherFilter
              ? `Websites by ${publisherFilter}`
              : "Browse Websites"}
          </h2>
          <p className="text-[#999] text-sm mt-0.5">
            {publisherFilter
              ? `Showing all websites by ${publisherFilter}`
              : "View all websites on the platform"}
          </p>
        </div>
        {publisherFilter && (
          <button
            onClick={() => setPublisherFilter(null)}
            className="text-[12px] text-[#334155] border border-[#334155] px-3 py-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors shrink-0"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#bbb]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search websites, categories, owners..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e8ddd2] rounded-xl text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:border-[#334155] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#888]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category pills — hidden when publisher filtered */}
      {!publisherFilter && (
        <CategoryPills
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* Result count */}
      {(search || publisherFilter) && (
        <p className="text-[12px] text-[#999]">
          {filteredApps.length} result{filteredApps.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="inline-block w-6 h-6 border-2 border-[#334155] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16 text-[#bbb] text-sm">
          {search
            ? `No results for "${search}"`
            : publisherFilter
              ? `No websites by ${publisherFilter}`
              : "No websites found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <WebsiteCard
              key={app._id}
              app={app}
              onClick={() => setSelectedId(app._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

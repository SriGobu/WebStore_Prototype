import { useEffect, useState } from "react";
import useWebsiteStore from "../../../Store/websiteStore";
import CategoryPills from "../../../Components/User/CategoryPills";
import WebsiteCard from "../../../Components/Developer/WebsiteCard";
import DevWebsiteView from "./DevWebsiteView";
import { searchWebsites } from "../../../Utils/searchUtils";
import {
  getUniqueCategories,
  filterByCategory,
} from "../../../Utils/categoryUtils";
import FollowButton from "../../../Components/Common/FollowButton";

export default function DeveloperBrowseWebsites({ initialSelectedId = null }) {
  const { websites, fetchWebsites } = useWebsiteStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialSelectedId); // website _id | null
  const [publisherFilter, setPublisherFilter] = useState(null); // ownerName string | null

  const categories = getUniqueCategories(websites);

  // Apply search → category → publisher in sequence
  const searched = searchQuery.trim()
    ? searchWebsites(websites, searchQuery)
    : websites;

  const byCategory = filterByCategory(searched, selectedCategory);

  const filteredApps = publisherFilter
    ? byCategory.filter((w) => w.ownerName === publisherFilter)
    : byCategory;

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const publisherId = publisherFilter
    ? websites.find((w) => w.ownerName === publisherFilter)?.ownerId
    : null;

  // ── Publisher filter view ──────────────────────────────────────────────────
  function handlePublisherClick(ownerName) {
    setPublisherFilter(ownerName);
    setSelectedId(null); // go back to grid
    setSelectedCategory("All"); // reset category
    setSearchQuery("");
  }

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedId) {
    return (
      <DevWebsiteView
        websiteId={selectedId}
        onBack={() => setSelectedId(null)}
        onNavigate={(id) => setSelectedId(id)}
        onPublisherClick={handlePublisherClick}
      />
    );
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-[#1a1a1a] text-xl flex items-center gap-3">
            {publisherFilter
              ? `Websites by ${publisherFilter}`
              : "Browse Websites"}
            {publisherFilter && publisherId && (
              <FollowButton developerId={publisherId} />
            )}
          </h2>
          <p className="text-[#999] text-sm mt-0.5">
            {publisherFilter
              ? `Showing all websites published by ${publisherFilter}`
              : "Discover curated tools, services and productivity websites"}
          </p>
        </div>

        {/* Clear publisher filter */}
        {publisherFilter && (
          <button
            onClick={() => setPublisherFilter(null)}
            className="text-[12px] text-[#c4956a] border border-[#c4956a] px-3 py-1.5 rounded-lg hover:bg-[#f5efe6] transition-colors shrink-0"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Search bar */}
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search websites, tools, apps..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e8ddd2] rounded-xl text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none focus:border-[#c4956a] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#888]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category pills — hidden when publisher filter is active */}
      {!publisherFilter && (
        <CategoryPills
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* Results count */}
      {(searchQuery || publisherFilter) && (
        <p className="text-[12px] text-[#999]">
          {filteredApps.length} result{filteredApps.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 text-[#bbb] text-sm">
          {searchQuery
            ? `No results for "${searchQuery}"`
            : publisherFilter
              ? `No websites found for ${publisherFilter}`
              : "No websites found in this category."}
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

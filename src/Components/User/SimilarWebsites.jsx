/**
 * SimilarWebsites
 *
 * Shows other websites sharing the same category as the current website,
 * excluding the current website itself.
 *
 * Props:
 * - currentWebsite: the website currently being viewed
 * - allWebsites: full list of websites (from GET /user/websites)
 * - onNavigate: (websiteId) => void
 * - maxItems: number of items to show (default 5)
 */
export default function SimilarWebsites({
  currentWebsite,
  allWebsites,
  onNavigate,
  maxItems = 5,
}) {
  if (!currentWebsite) return null;

  const similar = allWebsites
    .filter(
      (site) =>
        site._id !== currentWebsite._id &&
        site.category === currentWebsite.category,
    )
    .slice(0, maxItems);

  if (similar.length === 0) return null;

  return (
    <div className="bg-[#fafafa] rounded-xl shadow-md p-4">
      <h3 className="font-semibold text-[#111] text-base mb-4">
        Similar Websites
      </h3>
      <div className="space-y-4">
        {similar.map((site) => (
          <SiteRow
            key={site._id}
            app={site}
            onNavigate={() => onNavigate(site._id)}
          />
        ))}
      </div>
    </div>
  );
}

function SiteRow({ app, onNavigate }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-[#e0d9d0] last:border-0">
      <div className="rounded-lg size-10 shrink-0 overflow-hidden">
        <img
          src={app.icon?.url}
          alt={app.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#111] text-sm truncate">{app.name}</p>
        <p className="font-light text-[#767676] text-xs truncate capitalize">
          {app.category}
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="bg-[#f5efe6] border-[1.5px] border-[#c4956a] px-3 py-1 rounded-md font-medium text-[#c4956a] text-[10px] hover:bg-[#c4956a] hover:text-white transition-colors shrink-0"
      >
        View
      </button>
    </div>
  );
}

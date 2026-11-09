import { useNavigate } from "react-router-dom";

// ─── Star Row ─────────────────────────────────────────────────────────────────

function StarRow({ rating }) {
  const rounded = Math.round(Number(rating));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={i <= rounded ? "fill-amber-400" : "fill-gray-200"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-semibold text-[#1a1a1a]">
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

export default function WebsiteCard({ app, onClick }) {
  const navigate = useNavigate();

  const avgRating = app?.averageRating ?? null;
  const likes = app?.likes ?? 0;
  const visitors = app?.uniqueVisitors ?? 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#e8ddd2] p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer relative"
    >
      {/* ── Header: icon + name + subtitle ── */}
      <div className="flex items-start gap-3 pr-7">
        <div className="size-11 rounded-xl bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
          {app?.icon?.url ? (
            <img
              src={app.icon.url}
              alt={app.name}
              className="size-full object-cover"
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="fill-none stroke-[#c4956a]"
              style={{ strokeWidth: 1.5 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1a1a1a] text-[15px] leading-snug truncate">
            {app?.name}
          </h3>
          <p className="text-xs text-[#767676] mt-0.5 truncate">
            {app?.category}
            {app?.category && app?.ownerName && " · "}
            {app?.ownerName && (
              <>
                by <span className="text-[#c4956a]">{app.ownerName}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Description ── */}
      {app?.description && (
        <p className="text-[13px] text-[#444] leading-relaxed line-clamp-2">
          {app.description}
        </p>
      )}

      {/* ── Tags ── */}
      {app?.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {app.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] bg-[#f5efe6] text-[#555] px-2.5 py-0.5 rounded-full capitalize"
            >
              {tag}
            </span>
          ))}
          {app.tags.length > 3 && (
            <span className="text-[11px] text-[#bbb]">
              +{app.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* ── Stats: visitors · likes on left, stars on right ── */}
      <div className="flex items-center justify-between text-[12px] text-[#888]">
        <div className="flex items-center gap-2">
          {visitors > 0 && <span>{visitors.toLocaleString()} visitors</span>}
          {visitors > 0 && likes > 0 && <span className="text-[#ddd]">·</span>}
        </div>

        {avgRating ? (
          <StarRow rating={avgRating} />
        ) : (
          <span className="text-[11px] text-[#bbb]">Not rated</span>
        )}
      </div>

      {/* ── Visit Website button ── */}
      <a
        href={app?.url ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={async (e) => {
          e.stopPropagation();
          if (app?._id) navigate(`/website/${app._id}`);
        }}
        className="mt-1 w-full flex items-center justify-center gap-1.5 border border-[#e8ddd2] rounded-xl py-2.5 text-sm font-medium text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors"
      >
        Visit
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          className="fill-none stroke-current"
          style={{ strokeWidth: 2 }}
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}

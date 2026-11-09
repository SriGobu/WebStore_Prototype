import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useWebsiteStore from "../../Store/websiteStore";
import { searchWebsites } from "../../Utils/searchUtils";

/**
 * SearchOverlay
 *
 * Self-contained search trigger (icon button) + full-screen search
 * modal with live results, Play Store/App Store style. Owns its own
 * open/close and query state internally — drop it anywhere a search
 * entry point is needed (Header today, possibly a mobile nav or
 * standalone search page later) without wiring anything from the
 * parent beyond rendering it.
 */
export default function SearchOverlay() {
  const navigate = useNavigate();
  const { websites } = useWebsiteStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  const searchResults = searchWebsites(websites, searchQuery);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleEsc(event) {
      if (event.key === "Escape") {
        close();
      }
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  function close() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function handleSelectResult(websiteId) {
    close();
    navigate(`/website/${websiteId}`);
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="p-2 rounded-full hover:bg-[#f5efe6] transition-colors hover:cursor-pointer"
        aria-label="Open search"
      >
        <svg
          className="w-5 h-5 text-[#767676]"
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
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] flex items-start justify-center px-4 transition-all duration-300 ${
          searchOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={close} />

        <div
          className={`relative w-full max-w-2xl mt-24 transition-all duration-300 ${
            searchOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-4 opacity-0"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl flex items-center px-5 py-4 gap-3">
            <svg
              className="w-5 h-5 text-[#767676] shrink-0"
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
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search websites, tools, productivity apps..."
              className="flex-1 text-[#111] text-sm outline-none placeholder:text-[#767676]"
            />
            <button
              onClick={close}
              className="hover:cursor-pointer text-[#767676] hover:text-[#111] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Results / Suggestions */}
          <div className="bg-white rounded-2xl mt-2 shadow-lg overflow-hidden max-h-96 overflow-y-auto">
            {searchResults.length > 0 ? (
              <>
                <p className="px-5 py-3 text-xs text-[#767676] font-medium border-b border-[#f0e8de]">
                  {searchResults.length} result
                  {searchResults.length === 1 ? "" : "s"}
                </p>
                {searchResults.map((app) => (
                  <button
                    key={app._id}
                    onClick={() => handleSelectResult(app._id)}
                    className="w-full text-left px-5 py-3 hover:bg-[#f5efe6] flex items-center gap-3 transition-colors"
                  >
                    <div className="size-9 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={app.icon?.url}
                        alt={app.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#111] text-sm font-medium truncate">
                        {app.name}
                      </p>
                      <p className="text-[#767676] text-xs truncate">
                        {app.ownerName || app.category}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <p className="px-5 py-8 text-center text-[#767676] text-sm">
                No results {searchQuery ? searchQuery : "..." }
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

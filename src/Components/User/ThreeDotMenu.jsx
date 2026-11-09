import { useState, useRef, useEffect } from "react";

/**
 * ThreeDotMenu
 *
 * Reusable ⋮ menu for review/reply cards.
 * Shows "Report" option for content the current user didn't write.
 * Shows "Edit" and "Delete" for content the current user wrote.
 *
 * Props:
 * - isOwn: boolean — true if current user wrote this content
 * - onEdit: () => void (optional, only if isOwn)
 * - onDelete: () => void (optional, only if isOwn)
 * - onReport: () => void (optional, only if !isOwn)
 * - alreadyReported: boolean
 */
export default function ThreeDotMenu({
  isOwn,
  onEdit,
  onDelete,
  onReport,
  alreadyReported = false,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 rounded-full hover:bg-[#f5efe6] transition-colors text-[#767676] hover:text-[#111]"
        aria-label="More options"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-[#e0d9d0] overflow-hidden z-50">
          {isOwn ? (
            <>
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#111] hover:bg-[#f5efe6] transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => {
                if (!alreadyReported) {
                  onReport?.();
                }
                setOpen(false);
              }}
              disabled={alreadyReported}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                alreadyReported
                  ? "text-[#767676] cursor-not-allowed"
                  : "text-red-500 hover:bg-red-50"
              }`}
            >
              {alreadyReported ? "Reported ✓" : "Report"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";

/**
 * OptionsMenu — reusable three-dot (kebab) dropdown trigger.
 *
 * Generic on purpose so it isn't tied to reporting — drop it anywhere a
 * compact "more actions" affordance is needed (cards, list rows, headers).
 *
 * Props:
 * - items      : [{ label, icon?: ReactNode, onClick: () => void, danger?: boolean, disabled?: boolean }]
 * - className  : positioning classes for the trigger wrapper
 *                (e.g. "absolute -top-2 -right-2" to anchor over a corner)
 * - align      : "left" | "right" — which side the dropdown opens toward (default "right")
 */
export default function OptionsMenu({
  items = [],
  className = "",
  align = "right",
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="More options"
        aria-expanded={open}
        className="size-8 rounded-full bg-white border border-[#e0d9d0] shadow-sm flex items-center justify-center text-[#767676] hover:text-[#111] hover:border-[#c4956a] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="fill-current"
        >
          <circle cx="12" cy="6" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="18" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1.5 min-w-[170px] bg-white rounded-xl border border-[#e0d9d0] shadow-lg py-1.5 z-20 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map(({ label, icon, onClick, danger, disabled }, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (disabled) return;
                setOpen(false);
                onClick();
              }}
              disabled={disabled}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                disabled
                  ? "text-[#ccc] cursor-not-allowed"
                  : danger
                    ? "text-red-500 hover:bg-red-50"
                    : "text-[#333] hover:bg-[#f5efe6]"
              }`}
            >
              {icon && <span className="shrink-0">{icon}</span>}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

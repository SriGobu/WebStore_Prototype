import { useState, useRef, useEffect } from "react";

export default function ReasonSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? "Select a reason";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:border-[#c4956a] transition-colors ${
          value ? "text-[#111]" : "text-[#b0a898]"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className={`fill-none stroke-[#767676] shrink-0 ml-2 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          style={{ strokeWidth: 2 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-[#fafafa] border border-[#e0d9d0] rounded-xl shadow-lg max-h-56 overflow-y-auto py-1">
          {options.map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f5efe6] transition-colors ${
                v === value
                  ? "bg-[#e8dfd4] text-[#111] font-medium"
                  : "text-[#333]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import { X, Menu } from "lucide-react";

// ─── Shared modal with sidebar TOC (desktop) / dropdown (mobile) ────────────

export default function LegalModal({ content, onClose }) {
  const [activeId, setActiveId] = useState(content.sections[0]?.id);
  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  function scrollToSection(id) {
    setActiveId(id);
    const el = sectionRefs.current[id];
    if (el && contentRef.current) {
      contentRef.current.scrollTo({
        top: el.offsetTop - 12,
        behavior: "smooth",
      });
    }
  }

  const hasMultipleSections = content.sections.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e0d9d0] shrink-0">
          <div>
            <h3 className="font-semibold text-[#111] text-base">
              {content.title}
            </h3>
            {content.updated && (
              <p className="font-light text-[#767676] text-xs mt-0.5">
                {content.updated}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#767676] hover:text-[#111] shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile section dropdown */}
        {hasMultipleSections && (
          <div className="md:hidden px-4 py-3 border-b border-[#e0d9d0] bg-white shrink-0">
            <div className="relative">
              <select
                value={activeId}
                onChange={(e) => scrollToSection(e.target.value)}
                className="w-full appearance-none bg-[#f5efe6] border border-[#e0d9d0] rounded-lg px-3 py-2 pr-8 text-[13px] text-[#111] focus:outline-none focus:border-[#c4956a]"
              >
                {content.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.heading}
                  </option>
                ))}
              </select>
              <Menu
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Body: sidebar (desktop) + scrollable content */}
        <div className="flex flex-1 overflow-hidden">
          {hasMultipleSections && (
            <aside className="hidden md:block w-56 shrink-0 border-r border-[#e0d9d0] bg-white overflow-y-auto">
              <nav className="py-3">
                {content.sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`w-full text-left px-4 py-2 text-[12.5px] leading-snug transition-colors ${
                      activeId === s.id
                        ? "bg-[#f5efe6] text-[#c4956a] font-semibold border-r-2 border-[#c4956a]"
                        : "text-[#555] hover:bg-[#faf7f3] hover:text-[#c4956a]"
                    }`}
                  >
                    {s.heading}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto p-6 space-y-8"
          >
            {content.sections.map((s) => (
              <div
                key={s.id}
                ref={(el) => (sectionRefs.current[s.id] = el)}
                className="scroll-mt-3"
              >
                <h4 className="font-semibold text-[#111] text-sm mb-2">
                  {s.heading}
                </h4>
                <div className="space-y-2">
                  {s.body.map((para, i) => (
                    <p
                      key={i}
                      className="font-light text-[#333] text-[13px] leading-relaxed"
                    >
                      {para}
                    </p>
                  ))}
                  {s.list && (
                    <ul className="list-disc list-outside pl-5 space-y-1">
                      {s.list.map((item, i) => (
                        <li
                          key={i}
                          className="font-light text-[#333] text-[13px] leading-relaxed"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.footer && (
                    <p className="font-light text-[#333] text-[13px] leading-relaxed pt-1">
                      {s.footer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

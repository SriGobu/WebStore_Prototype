import { useRef, useCallback } from "react";

export default function CategoryPills({ categories, selected, onSelect }) {
  const scrollRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    scrollStart: 0,
    dragMoved: false,
  });

  const DRAG_THRESHOLD = 5;

  const onMouseDown = useCallback((e) => {
    dragState.current = {
      isDragging: true,
      startX: e.pageX,
      scrollStart: scrollRef.current.scrollLeft,
      dragMoved: false,
    };
    scrollRef.current.style.scrollBehavior = "auto";
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    const dx = e.pageX - dragState.current.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) dragState.current.dragMoved = true;
    scrollRef.current.scrollLeft = dragState.current.scrollStart - dx;
  }, []);

  const onMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
  }, []);

  const onTouchStart = useCallback((e) => {
    dragState.current = {
      isDragging: true,
      startX: e.touches[0].pageX,
      scrollStart: scrollRef.current.scrollLeft,
      dragMoved: false,
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    const dx = e.touches[0].pageX - dragState.current.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD) dragState.current.dragMoved = true;
    scrollRef.current.scrollLeft = dragState.current.scrollStart - dx;
  }, []);

  function handleSelect(category) {
    if (dragState.current.dragMoved) return;
    onSelect(category);
  }

  return (
    <div className="relative overflow-hidden">
      {/* Left fade edge */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#f5efe6] to-transparent z-10" />

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto select-none cursor-grab active:cursor-grabbing px-4"
        style={{ scrollbarWidth: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleSelect(category)}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-2xl border-[1.5px] text-xs transition-colors ${
              selected === category
                ? "bg-[#c4956a] border-[#c4956a] text-white font-medium"
                : "bg-[#f5efe6] border-[#e0d9d0] text-[#767676] font-normal hover:border-[#c4956a]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Right fade edge */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#f5efe6] to-transparent z-10" />
    </div>
  );
}

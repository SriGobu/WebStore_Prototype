import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fullscreen screenshot lightbox — Play Store / App Store style.
 * Shared across User, Developer, and Admin views wherever a website's
 * screenshots need a fullscreen viewer, not just a thumbnail strip.
 *
 * Props:
 * - screenshots : [{ _id, url }]
 * - activeIndex  : number — currently shown screenshot
 * - onChangeIndex: (newIndex) => void
 * - onClose      : () => void
 */
export default function ScreenshotViewer({
  screenshots,
  activeIndex,
  onChangeIndex,
  onClose,
}) {
  const goPrev = useCallback(() => {
    onChangeIndex((activeIndex - 1 + screenshots.length) % screenshots.length);
  }, [activeIndex, screenshots.length, onChangeIndex]);

  const goNext = useCallback(() => {
    onChangeIndex((activeIndex + 1) % screenshots.length);
  }, [activeIndex, screenshots.length, onChangeIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, onClose]);

  // Lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!screenshots?.length) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose} // click backdrop closes
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white/70 text-sm font-medium z-10">
        {activeIndex + 1} / {screenshots.length}
      </div>

      {/* Prev arrow */}
      {screenshots.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 sm:left-6 size-11 sm:size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          aria-label="Previous screenshot"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Centered image */}
      <img
        src={screenshots[activeIndex].url}
        alt={`Screenshot ${activeIndex + 1}`}
        onClick={(e) => e.stopPropagation()} // clicking the image itself doesn't close
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
      />

      {/* Next arrow */}
      {screenshots.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 sm:right-6 size-11 sm:size-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          aria-label="Next screenshot"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Thumbnail strip at bottom */}
      {screenshots.length > 1 && (
        <div
          className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {screenshots.map((shot, i) => (
            <button
              key={shot._id}
              onClick={() => onChangeIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to screenshot ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

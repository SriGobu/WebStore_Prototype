import { useState, useEffect } from "react";
import { Star, Heart, Globe } from "lucide-react";
import { getMyReviews } from "../../../Services/User/profileService";
import {
  getWishlist,
  removeFromWishlist,
} from "../../../Services/Developer/wishlistService";

export default function DevActivity({ onToast, onViewWebsite }) {
  const [tab, setTab] = useState("reviews"); // "reviews" | "wishlist"
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [reviewsRes, wishlistRes] = await Promise.all([
          getMyReviews(),
          getWishlist(),
        ]);
        if (cancelled) return;
        setReviews(reviewsRes.data?.reviews ?? []);
        setWishlist(
          wishlistRes.data?.websites ?? wishlistRes.data?.wishlist ?? [],
        );
      } catch (err) {
        if (!cancelled) onToast(err.message || "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

  async function handleRemoveWishlist(id) {
    try {
      await removeFromWishlist(id);
      setWishlist((prev) => prev.filter((w) => w._id !== id));
      onToast("Removed from wishlist");
    } catch (err) {
      onToast(err.message || "Failed to remove");
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* ── Toggle ── */}
      <div className="flex gap-1 bg-[#f5efe6] rounded-xl p-1 w-fit">
        {[
          {
            id: "reviews",
            label: "Reviews",
            icon: Star,
            count: reviews.length,
          },
          {
            id: "wishlist",
            label: "Wishlist",
            icon: Heart,
            count: wishlist.length,
          },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              tab === id
                ? "bg-white text-[#c4956a] shadow-sm"
                : "text-[#888] hover:text-[#555]"
            }`}
          >
            <Icon size={13} />
            {label}
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                tab === id
                  ? "bg-[#f5efe6] text-[#c4956a]"
                  : "bg-white text-[#bbb]"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Reviews ── */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <Empty text="No reviews written yet." />
          ) : (
            reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-white rounded-xl border border-[#e8ddd2] p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="size-10 rounded-lg bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
                    {rev.websiteId?.icon?.url ? (
                      <img
                        src={rev.websiteId.icon.url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Globe size={16} className="text-[#c4956a]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-[#1a1a1a] text-[13px] truncate">
                        {rev.websiteId?.name ?? "Unknown Website"}
                      </p>
                      {/* Stars */}
                      <div className="flex gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < rev.rating
                                ? "text-amber-400 text-xs"
                                : "text-gray-200 text-xs"
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    {rev.design && (
                      <p className="text-[12px] text-[#666] line-clamp-2 mb-2">
                        {rev.design}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#bbb]">
                        {new Date(rev.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {rev.websiteId?._id && (
                        <button
                          onClick={() => onViewWebsite(rev.websiteId._id)}
                          className="text-[11px] text-[#c4956a] hover:underline"
                        >
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Wishlist ── */}
      {tab === "wishlist" && (
        <div className="space-y-3">
          {wishlist.length === 0 ? (
            <Empty text="Your wishlist is empty." />
          ) : (
            wishlist.map((site) => (
              <div
                key={site._id}
                className="bg-white rounded-xl border border-[#e8ddd2] p-4 flex items-center gap-3"
              >
                <div className="size-10 rounded-lg bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
                  {site.icon?.url ? (
                    <img
                      src={site.icon.url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <Globe size={16} className="text-[#c4956a]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1a1a1a] text-[13px] truncate">
                    {site.name}
                  </p>
                  <p className="text-[11px] text-[#999] capitalize">
                    {site.category}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onViewWebsite(site._id)}
                    className="px-3 py-1 text-[11px] border border-[#c4956a] text-[#c4956a] rounded-lg hover:bg-[#c4956a] hover:text-white transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleRemoveWishlist(site._id)}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-12 text-[#bbb] text-sm">{text}</div>;
}

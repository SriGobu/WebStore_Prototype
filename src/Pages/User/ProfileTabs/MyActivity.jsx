import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyReviews } from "../../../Services/User/profileService";
import {
  getWishlist,
  removeFromWishlist,
} from "../../../Services/User/wishListService";

export default function MyActivity({ onToast }) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [reviewsRes, wishlistRes] = await Promise.all([
          getMyReviews(),
          getWishlist(),
        ]);
        setReviews(reviewsRes.data.reviews ?? []);
        setWishlist(
          wishlistRes.data.websites ?? wishlistRes.data.wishlist ?? [],
        );
      } catch (err) {
        onToast(err.message || "Failed to load activity");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [onToast]);

  async function handleRemoveWishlist(websiteId) {
    try {
      await removeFromWishlist(websiteId);
      setWishlist((prev) => prev.filter((w) => w._id !== websiteId));
      onToast("Removed from wishlist");
    } catch (err) {
      onToast(err.message || "Failed to remove from wishlist");
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Reviews Section */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-[#111] text-lg mb-4">
          My Reviews{" "}
          <span className="text-[#767676] font-light text-sm">
            ({reviews.length})
          </span>
        </h2>

        {reviews.length === 0 ? (
          <p className="font-light text-[#767676] text-sm text-center py-8">
            You haven't written any reviews yet.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg overflow-hidden shrink-0 bg-[#e0d9d0]">
                      {rev.websiteId?.icon?.url ? (
                        <img
                          src={rev.websiteId.icon.url}
                          alt={rev.websiteId?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#c4956a]" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#111] text-sm">
                        {rev.websiteId?.name ?? "Unknown Website"}
                      </p>
                      <p className="font-light text-[#767676] text-xs capitalize">
                        {rev.websiteId?.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < rev.rating
                            ? "text-[#c4956a] text-sm"
                            : "text-[#e0d9d0] text-sm"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {rev.design && (
                  <p className="font-light text-[#333] text-sm line-clamp-2 mb-2">
                    {rev.design}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <p className="font-light text-[#767676] text-xs">
                    {new Date(rev.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {rev.websiteId?._id && (
                    <button
                      onClick={() => navigate(`/website/${rev.websiteId._id}`)}
                      className="text-[#c4956a] text-xs font-semibold hover:underline"
                    >
                      View Website →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-[#111] text-lg mb-4">
          My Wishlist{" "}
          <span className="text-[#767676] font-light text-sm">
            ({wishlist.length})
          </span>
        </h2>

        {wishlist.length === 0 ? (
          <p className="font-light text-[#767676] text-sm text-center py-8">
            Your wishlist is empty. Add websites you'd like to revisit.
          </p>
        ) : (
          <div className="space-y-3">
            {wishlist.map((site) => (
              <div
                key={site._id}
                className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl p-4 flex items-center gap-3"
              >
                <div className="size-10 rounded-lg overflow-hidden shrink-0">
                  {site.icon?.url ? (
                    <img
                      src={site.icon.url}
                      alt={site.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#c4956a]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#111] text-sm truncate">
                    {site.name}
                  </p>
                  <p className="font-light text-[#767676] text-xs capitalize truncate">
                    {site.category}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/website/${site._id}`)}
                    className="bg-[#f5efe6] border-[1.5px] border-[#c4956a] px-3 py-1 rounded-lg font-medium text-[#c4956a] text-xs hover:bg-[#c4956a] hover:text-white transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleRemoveWishlist(site._id)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

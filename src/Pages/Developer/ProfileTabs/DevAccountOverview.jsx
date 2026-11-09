import { useState, useEffect } from "react";
import { Globe, Star, Eye, Code } from "lucide-react";
import {
  getProfile,
  getMyReviews,
} from "../../../Services/User/profileService";
import { getMyWebsites } from "../../../Services/Developer/websiteService";
import { getWishlist } from "../../../Services/Developer/wishlistService";

export default function DevAccountOverview({ onToast }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ websites: 0, reviews: 0, wishlist: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profileRes, websitesRes, reviewsRes, wishlistRes] =
          await Promise.all([
            getProfile(),
            getMyWebsites(),
            getMyReviews(),
            getWishlist(),
          ]);
        if (cancelled) return;
        setProfile(profileRes.data.user ?? profileRes.data);
        setStats({
          websites: websitesRes.data?.websites?.length ?? 0,
          reviews: reviewsRes.data?.reviews?.length ?? 0,
          wishlist: (
            wishlistRes.data?.websites ??
            wishlistRes.data?.wishlist ??
            []
          ).length,
        });
      } catch (err) {
        if (!cancelled) onToast(err.message || "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [onToast]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const STAT_CARDS = [
    {
      label: "Websites",
      value: stats.websites,
      icon: Globe,
      color: "#c4956a",
      bg: "#fdf4eb",
    },
    {
      label: "Reviews",
      value: stats.reviews,
      icon: Star,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      label: "Wishlist",
      value: stats.wishlist,
      icon: Eye,
      color: "#6366f1",
      bg: "#eef2ff",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Profile card ── */}
      <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="size-16 rounded-2xl bg-[#c4956a] flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-[#1a1a1a] text-lg truncate">
                {profile?.name}
              </h3>
              <span className="bg-[#c4956a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                DEV
              </span>
            </div>
            <p className="text-[#888] text-[13px] mb-2 truncate">
              {profile?.email}
            </p>
            <div className="flex items-center gap-1.5">
              <Code size={12} className="text-[#c4956a]" />
              <span className="text-[11px] text-[#888]">
                Member since {joined}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-[#e8ddd2] p-4 flex flex-col items-center gap-2"
          >
            <div
              className="size-9 rounded-lg flex items-center justify-center"
              style={{ background: bg }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <p className="font-bold text-[#1a1a1a] text-xl">{value}</p>
            <p className="text-[11px] text-[#999]">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Account details ── */}
      <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
        <h4 className="text-[12px] font-semibold text-[#999] uppercase tracking-wider mb-4">
          Account Details
        </h4>
        <div className="space-y-3">
          {[
            { label: "Full Name", value: profile?.name },
            { label: "Email", value: profile?.email },
            { label: "Role", value: profile?.role },
            { label: "Joined", value: joined },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 border-b border-[#f5efe6] last:border-0"
            >
              <span className="text-[12px] text-[#999]">{label}</span>
              <span className="text-[13px] font-medium text-[#1a1a1a] capitalize">
                {value ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

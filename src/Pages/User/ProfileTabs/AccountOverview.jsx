import { useState, useEffect } from "react";
import {
  getProfile,
  getMyReviews,
} from "../../../Services/User/profileService";
import { getVisitedWebsites } from "../../../Services/User/websiteService";

export default function AccountOverview({ onToast }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    visited: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [profileRes, visitedRes, reviewsRes] = await Promise.all([
          getProfile(),
          getVisitedWebsites(),
          getMyReviews(),
        ]);
        setProfile(profileRes.data.user ?? profileRes.data);
        setStats({
          visited: visitedRes.data.websites?.length ?? 0,
          reviews: reviewsRes.data.reviews?.length ?? 0,
        });
      } catch (err) {
        onToast(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [onToast]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-[#111] text-lg mb-6">Profile</h2>
        <div className="flex items-center gap-6">
          <div className="size-20 rounded-full bg-[#c4956a] flex items-center justify-center shrink-0">
            <span className="font-bold text-white text-2xl">{initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#111] text-xl mb-1">
              {profile?.name}
            </h3>
            <p className="text-[#767676] text-sm mb-3">{profile?.email}</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#c4956a] text-white px-3 py-1 rounded-full text-xs font-medium capitalize">
                {profile?.role ?? "User"}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Member Since",
            value: profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })
              : "—",
          },
          { label: "Visited", value: stats.visited },
          { label: "Reviews", value: stats.reviews },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#fafafa] rounded-xl shadow-md p-5">
            <p className="font-light text-[#767676] text-sm mb-1">{label}</p>
            <p className="font-semibold text-[#111] text-lg">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Globe,
  Users,
  Star,
  TrendingUp,
  Clock,
  Award,
  Eye,
} from "lucide-react";
import {
  getMyWebsites,
  getWebsiteStats,
} from "../../../Services/Developer/websiteService";
import useAuthStore from "../../../Store/authStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRow({ rating }) {
  const rounded = Math.round(Number(rating));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          className={i <= rounded ? "fill-amber-400" : "fill-gray-200"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="ml-0.5 text-[10px] text-[#888]">
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
    inactive: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${map[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#e8ddd2]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#999] text-[11px] font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1a1a1a]">{value}</p>
        </div>
        <div
          className="size-9 rounded-lg flex items-center justify-center"
          style={{ background: bg }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function WebsiteIcon({ website }) {
  return (
    <div className="size-8 rounded-lg bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
      {website.icon?.url ? (
        <img src={website.icon.url} alt="" className="size-full object-cover" />
      ) : (
        <Globe size={14} className="text-[#c4956a]" />
      )}
    </div>
  );
}

function ReviewRow({ w }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-7 rounded-md bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
        {w.icon?.url ? (
          <img src={w.icon.url} alt="" className="size-full object-cover" />
        ) : (
          <Globe size={12} className="text-[#c4956a]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[#1a1a1a] truncate">
          {w.name}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <StarRow rating={w.averageRating} />
        <span className="text-[11px] text-[#bbb]">({w.totalReviews ?? 0})</span>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DeveloperDashboard() {
  const { user } = useAuthStore();
  const [websites, setWebsites] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // 1. fetch all my websites
        const res = await getMyWebsites();
        const sites = res.data?.websites ?? [];
        setWebsites(sites);

        // 2. fetch stats for each website in parallel
        const results = await Promise.allSettled(
          sites.map((w) =>
            getWebsiteStats(w._id).then((r) => [w._id, r.data?.stats ?? null]),
          ),
        );
        const map = {};
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value[1]) {
            map[r.value[0]] = r.value[1];
          }
        });
        setStatsMap(map);
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Computed values ────────────────────────────────────────────────────────

  const totalWebsites = websites.length;
  const activeWebsites = websites.filter((w) => w.status === "active").length;
  const pendingWebsites = websites.filter((w) => w.status === "pending").length;

  const totalVisitors = Object.values(statsMap).reduce(
    (sum, s) => sum + (s?.totalVisitors ?? 0),
    0,
  );

  const ratedSites = websites.filter((w) => (w.averageRating ?? 0) > 0);
  const overallAvgRating =
    ratedSites.length > 0
      ? (
          ratedSites.reduce((s, w) => s + w.averageRating, 0) /
          ratedSites.length
        ).toFixed(1)
      : null;

  const byVisitors = [...websites]
    .map((w) => ({ ...w, visitors: statsMap[w._id]?.totalVisitors ?? 0 }))
    .sort((a, b) => b.visitors - a.visitors);

  const maxVisitors = byVisitors[0]?.visitors || 1;

  const recentlyUploaded = [...websites]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const byReview = websites
    .filter((w) => (w.averageRating ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.totalReviews ?? 0) - (a.totalReviews ?? 0) ||
        b.averageRating - a.averageRating,
    );

  const excellent = byReview.filter((w) => w.averageRating >= 4.5);
  const good = byReview.filter(
    (w) => w.averageRating >= 3.5 && w.averageRating < 4.5,
  );
  const needsWork = byReview.filter((w) => w.averageRating < 3.5);

  const statCards = [
    {
      label: "Total Websites",
      value: totalWebsites,
      icon: Globe,
      color: "#c4956a",
      bg: "#fdf4eb",
    },
    {
      label: "Active",
      value: activeWebsites,
      icon: TrendingUp,
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "Pending Approval",
      value: pendingWebsites,
      icon: Clock,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      label: "Total Visitors",
      value: totalVisitors.toLocaleString(),
      icon: Users,
      color: "#6366f1",
      bg: "#eef2ff",
    },
    {
      label: "Avg Rating",
      value: overallAvgRating ?? "Not yet",
      icon: Star,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="inline-block w-7 h-7 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    /* Max-width container prevents stretching on wide desktop monitors while remaining fully responsive */
    <div className="space-y-6 max-w-5xl w-full mx-auto px-4 md:px-0">
      {/* Greeting */}
      <div>
        <h2 className="font-semibold text-[#1a1a1a] text-xl">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-[#999] text-sm mt-0.5">
          Here's an overview of your websites and activity.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Metric Sections Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN GROUPING */}
        <div className="space-y-6">
          {/* ── Overall avg rating ── */}
          {overallAvgRating && (
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Star size={18} className="text-amber-400 fill-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-[#999] uppercase tracking-wide font-medium">
                  Overall Average Rating
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-[#1a1a1a]">
                    {overallAvgRating}
                  </span>
                  <StarRow rating={overallAvgRating} />
                  <span className="text-[12px] text-[#bbb] truncate">
                    across {ratedSites.length} website
                    {ratedSites.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Highly Visited ── */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
            <div className="flex items-center gap-2 mb-5">
              <Eye size={16} className="text-[#c4956a]" />
              <h2 className="font-semibold text-[#1a1a1a] text-sm">
                Highly Visited Websites
              </h2>
            </div>

            {byVisitors.length === 0 ? (
              <p className="text-[#bbb] text-sm text-center py-6">
                No websites yet.
              </p>
            ) : (
              <div className="space-y-4">
                {byVisitors.map((w, i) => (
                  <div
                    key={w._id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 bg-neutral-50/50 sm:bg-transparent p-3 sm:p-0 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-5 text-[11px] text-[#ccc] font-medium text-right shrink-0 hidden sm:block">
                        {i + 1}
                      </span>
                      <WebsiteIcon website={w} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="text-[13px] font-medium text-[#1a1a1a] truncate pr-2">
                            {w.name}
                          </span>
                          <span className="text-[12px] text-[#888] shrink-0 font-medium">
                            {w.visitors.toLocaleString()} visitors
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#f0ebe4] rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-[#c4956a] rounded-full transition-all"
                            style={{
                              width: `${Math.round((w.visitors / maxVisitors) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 sm:w-[90px] flex sm:justify-end pl-11 sm:pl-0">
                      {(w.averageRating ?? 0) > 0 ? (
                        <StarRow rating={w.averageRating} />
                      ) : (
                        <span className="text-[10px] text-[#ccc]">
                          Not Yet Rated
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN GROUPING */}
        <div className="space-y-6">
          {/* Recently Uploaded */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={16} className="text-[#c4956a]" />
              <h2 className="font-semibold text-[#1a1a1a] text-sm">
                Recently Uploaded
              </h2>
            </div>

            {recentlyUploaded.length === 0 ? (
              <p className="text-[#bbb] text-sm text-center py-6">
                No websites uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentlyUploaded.map((w) => (
                  <div
                    key={w._id}
                    className="flex items-center justify-between gap-3 p-1"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-9 rounded-lg bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
                        {w.icon?.url ? (
                          <img
                            src={w.icon.url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Globe size={15} className="text-[#c4956a]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#1a1a1a] truncate">
                          {w.name}
                        </p>
                        <p className="text-[11px] text-[#999] truncate">
                          {w.category} ·{" "}
                          {new Date(w.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={w.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing by Reviews */}
          <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
            <div className="flex items-center gap-2 mb-5">
              <Award size={16} className="text-[#c4956a]" />
              <h2 className="font-semibold text-[#1a1a1a] text-sm">
                Top Performing by Reviews
              </h2>
            </div>

            {byReview.length === 0 ? (
              <p className="text-[#bbb] text-sm text-center py-6">
                No reviewed websites yet.
              </p>
            ) : (
              <div className="space-y-4">
                {excellent.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                      Excellent (4.5+)
                    </p>
                    <div className="space-y-2">
                      {excellent.map((w) => (
                        <ReviewRow key={w._id} w={w} />
                      ))}
                    </div>
                  </div>
                )}
                {good.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-400 inline-block" />
                      Good (3.5–4.5)
                    </p>
                    <div className="space-y-2">
                      {good.map((w) => (
                        <ReviewRow key={w._id} w={w} />
                      ))}
                    </div>
                  </div>
                )}
                {needsWork.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-red-400 inline-block" />
                      Needs Improvement
                    </p>
                    <div className="space-y-2">
                      {needsWork.map((w) => (
                        <ReviewRow key={w._id} w={w} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

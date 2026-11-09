import { useEffect, useState } from "react";
import {
  Users,
  Globe,
  Code,
  Star,
  Eye,
  TrendingUp,
  Clock,
  Flag,
  LifeBuoy,
  ArrowUpCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "../../../Config/axios";
import Toast from "../../../Components/Common/Toast";

// ─── Design tokens (matches AdminDashboard.tsx) ───────────────────────────────
const T = {
  text: "#1a1410",
  muted: "#8a7968",
  border: "#e2d9cf",
  accent: "#c4956a",
  page: "#f5efe6",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconColor, bg, sub }) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex items-center gap-4"
      style={{ border: `1px solid ${T.border}` }}
    >
      <div
        className="size-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} color={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: T.muted }}>
          {label}
        </p>
        <p className="text-xl font-bold mt-0.5" style={{ color: T.text }}>
          {value ?? "—"}
        </p>
        {sub && (
          <p className="text-[11px] mt-0.5 truncate" style={{ color: T.muted }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Star size={12} fill="#f59e0b" color="#f59e0b" />
      <span className="text-xs font-semibold" style={{ color: T.text }}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} color={T.accent} />
      <h2 className="text-sm font-semibold" style={{ color: T.text }}>
        {title}
      </h2>
    </div>
  );
}

function AppIcon({ website }) {
  if (website.icon?.url) {
    return (
      <div className="size-9 rounded-xl overflow-hidden shrink-0">
        <img src={website.icon.url} alt="" className="size-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="size-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
      style={{ background: T.accent }}
    >
      {website.name?.charAt(0).toUpperCase() ?? <Globe size={14} />}
    </div>
  );
}

function WebsiteRow({ rank, website }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs font-bold w-5 text-right shrink-0"
        style={{ color: T.accent }}
      >
        #{rank}
      </span>
      <AppIcon website={website} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: T.text }}>
          {website.name}
        </p>
        <p className="text-xs truncate capitalize" style={{ color: T.muted }}>
          {website.category}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {website._visitors !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#ecfdf5", color: "#10b981" }}
          >
            {website._visitors?.toLocaleString()} visitors
          </span>
        )}
        {website.averageRating > 0 && (
          <StarRow rating={website.averageRating} />
        )}
        {website._uploads !== undefined && (
          <span className="text-xs font-semibold" style={{ color: T.muted }}>
            {website._uploads} uploads
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// Safe list extractor
// Axios interceptor returns response.data directly (not response)
// so res here is already the parsed body e.g. { success, message, data: { users: [] } }
function extractList(res) {
  if (!res) return [];
  const d = res?.data; // the inner data object
  if (!d) return Array.isArray(res) ? res : [];
  return (
    d?.users ??
    d?.websites ??
    d?.promotions ??
    d?.tickets ??
    d?.reports ??
    d?.logs ??
    (Array.isArray(d) ? d : [])
  );
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [
          usersRes,
          websitesRes,
          pendingRes,
          promoRes,
          ticketsRes,
          reportsRes,
        ] = await Promise.all([
          api.get("/admin/users", { params: { page: 1, limit: 1000 } }),
          api.get("/admin/websites", { params: { limit: 1000 } }),
          api.get("/admin/websites/pending"),
          api.get("/admin/promotions"),
          api.get("/admin/support"),
          api.get("/admin/reports"),
        ]);

        if (cancelled) return;

        // Each res is already response.data from the interceptor
        // Your backend wraps with { success, message, data: { ... } }
        const users = extractList(usersRes);
        const websites = extractList(websitesRes);
        const pending = extractList(pendingRes);
        const promos = extractList(promoRes);
        const tickets = extractList(ticketsRes);
        const reports = extractList(reportsRes);

        // ── User metrics ────────────────────────────────────────────────────
        const totalUsers = users.filter((u) => u.role === "user").length;
        const totalDevs = users.filter((u) => u.role === "developer").length;
        const activeUsers = users.filter(
          (u) => u.role === "user" && !u.accountLocked,
        ).length;
        const inactiveUsers = users.filter(
          (u) => u.role === "user" && u.accountLocked,
        ).length;
        const activeDevs = users.filter(
          (u) => u.role === "developer" && !u.accountLocked,
        ).length;
        const inactiveDevs = users.filter(
          (u) => u.role === "developer" && u.accountLocked,
        ).length;

        // ── Website metrics ─────────────────────────────────────────────────
        const totalWebsites = websites.length;
        const activeWebsites = websites.filter(
          (w) => w.status === "active",
        ).length;
        const pendingWebsites = websites.filter(
          (w) => w.status === "pending",
        ).length;
        const rejectedWebsites = websites.filter(
          (w) => w.status === "rejected",
        ).length;

        // ── Highly visited ─────────────────────────────────────────────────
        const highlyVisited = [...websites]
          .filter((w) => (w.uniqueVisitors ?? 0) > 0)
          .sort((a, b) => (b.uniqueVisitors ?? 0) - (a.uniqueVisitors ?? 0))
          .slice(0, 5)
          .map((w) => ({ ...w, _visitors: w.uniqueVisitors ?? 0 }));

        // ── Highly rated ───────────────────────────────────────────────────
        const highlyRated = [...websites]
          .filter((w) => (w.averageRating ?? 0) > 0)
          .sort(
            (a, b) =>
              (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
              (b.totalReviews ?? 0) - (a.totalReviews ?? 0),
          )
          .slice(0, 5);

        // ── Top uploading developers ────────────────────────────────────────
        const uploadCountByDev = {};
        websites.forEach((w) => {
          if (!w.ownerId && !w.ownerName) return;
          const key = w.ownerId ?? w.ownerName;
          uploadCountByDev[key] = (uploadCountByDev[key] ?? 0) + 1;
        });
        const topDevUploaders = Object.entries(uploadCountByDev)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([key, count]) => {
            const site = websites.find(
              (w) => (w.ownerId ?? w.ownerName) === key,
            );
            return { key, name: site?.ownerName ?? key, _uploads: count };
          });

        // ── Pending actions ─────────────────────────────────────────────────
        const pendingPromos = promos.filter(
          (p) => p.status === "pending",
        ).length;
        const openTickets = tickets.filter(
          (t) => t.status !== "resolved",
        ).length;
        const pendingReports = reports.filter(
          (r) => !r.status || r.status === "pending",
        ).length;

        setMetrics({
          totalUsers,
          totalDevs,
          activeUsers,
          inactiveUsers,
          activeDevs,
          inactiveDevs,
          totalWebsites,
          activeWebsites,
          pendingWebsites,
          rejectedWebsites,
          highlyVisited,
          highlyRated,
          topDevUploaders,
          pendingApproval: pending.length,
          pendingPromos,
          openTickets,
          pendingReports,
        });
      } catch (err) {
        setToastMessage(err?.message || "Failed to load metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span
          className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: T.accent, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div
      className="max-w-6xl mx-auto space-y-6"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: T.text }}>
          Platform Overview
        </h1>
        <p className="text-sm mt-0.5" style={{ color: T.muted }}>
          Full metrics across users, developers, and websites.
        </p>
      </div>

      {/* ── User stat cards ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.muted }}
        >
          Users
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={metrics.totalUsers}
            icon={Users}
            iconColor="#4f6ef7"
            bg="#eef3ff"
            sub={`${metrics.activeUsers} active · ${metrics.inactiveUsers} banned`}
          />
          <StatCard
            label="Active Users"
            value={metrics.activeUsers}
            icon={CheckCircle}
            iconColor="#10b981"
            bg="#ecfdf5"
          />
          <StatCard
            label="Banned Users"
            value={metrics.inactiveUsers}
            icon={XCircle}
            iconColor="#ef4444"
            bg="#fef2f2"
          />
          <StatCard
            label="Total Developers"
            value={metrics.totalDevs}
            icon={Code}
            iconColor="#8b5cf6"
            bg="#f3eeff"
            sub={`${metrics.activeDevs} active · ${metrics.inactiveDevs} banned`}
          />
        </div>
      </div>

      {/* ── Website stat cards ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.muted }}
        >
          Websites
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Websites"
            value={metrics.totalWebsites}
            icon={Globe}
            iconColor={T.accent}
            bg="#fff7ed"
          />
          <StatCard
            label="Active"
            value={metrics.activeWebsites}
            icon={CheckCircle}
            iconColor="#10b981"
            bg="#ecfdf5"
          />
          <StatCard
            label="Pending Approval"
            value={metrics.pendingWebsites}
            icon={Clock}
            iconColor="#f59e0b"
            bg="#fffbeb"
          />
          <StatCard
            label="Rejected"
            value={metrics.rejectedWebsites}
            icon={XCircle}
            iconColor="#ef4444"
            bg="#fef2f2"
          />
        </div>
      </div>

      {/* ── Pending actions ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: T.muted }}
        >
          Pending Actions
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Websites to Approve"
            value={metrics.pendingApproval}
            icon={Globe}
            iconColor="#f59e0b"
            bg="#fffbeb"
          />
          <StatCard
            label="Promotion Requests"
            value={metrics.pendingPromos}
            icon={ArrowUpCircle}
            iconColor="#8b5cf6"
            bg="#f3eeff"
          />
          <StatCard
            label="Open Tickets"
            value={metrics.openTickets}
            icon={LifeBuoy}
            iconColor="#10b981"
            bg="#ecfdf5"
          />
        </div>
      </div>

      {/* ── Bottom 3 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Highly Visited */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: `1px solid ${T.border}` }}
        >
          <SectionHeader icon={Eye} title="Highly Visited" />
          {metrics.highlyVisited.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: T.muted }}>
              No visits yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.highlyVisited.map((w, i) => (
                <WebsiteRow key={w._id} rank={i + 1} website={w} />
              ))}
            </div>
          )}
        </div>

        {/* Highly Rated */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: `1px solid ${T.border}` }}
        >
          <SectionHeader icon={Star} title="Highest Rated" />
          {metrics.highlyRated.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: T.muted }}>
              No ratings yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.highlyRated.map((w, i) => (
                <WebsiteRow key={w._id} rank={i + 1} website={w} />
              ))}
            </div>
          )}
        </div>

        {/* Top Uploading Developers */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: `1px solid ${T.border}` }}
        >
          <SectionHeader icon={TrendingUp} title="Top Uploading Developers" />
          {metrics.topDevUploaders.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: T.muted }}>
              No uploads yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.topDevUploaders.map((dev, i) => (
                <div key={dev.key} className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold w-5 text-right shrink-0"
                    style={{ color: T.accent }}
                  >
                    #{i + 1}
                  </span>
                  <div
                    className="size-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: T.text }}
                  >
                    <span className="text-white text-xs font-bold">
                      {dev.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: T.text }}
                    >
                      {dev.name}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold shrink-0"
                    style={{ color: T.muted }}
                  >
                    {dev._uploads} website{dev._uploads !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Pending website approval list ── */}
      {metrics.pendingApproval > 0 && (
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: `1px solid ${T.border}` }}
        >
          <SectionHeader icon={Clock} title="Websites Awaiting Approval" />
          <p className="text-xs mb-4" style={{ color: T.muted }}>
            Go to{" "}
            <span className="font-medium" style={{ color: T.text }}>
              Website Approval
            </span>{" "}
            tab to take action.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <Clock size={11} /> {metrics.pendingApproval} pending
            </span>
            {metrics.pendingReports > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <Flag size={11} /> {metrics.pendingReports} report
                {metrics.pendingReports !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Globe,
  Pencil,
  Trash2,
  Image,
  Heart,
  MessageSquare,
  User,
  Filter,
  Star,
  ShieldCheck,
  TicketCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getMyAuditLogs } from "../../../Services/Developer/auditService";
import Toast from "../../../Components/Common/Toast";

// ─── Action meta (unchanged — dev-specific, more precise than a keyword map) ──

const ACTION_META = {
  DEV_WEBSITE_CREATED: {
    label: "Website Created",
    icon: Globe,
    color: "#059669",
    bg: "#ecfdf5",
  },
  DEV_WEBSITE_UPDATED: {
    label: "Website Updated",
    icon: Pencil,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  DEV_WEBSITE_DELETED: {
    label: "Website Deleted",
    icon: Trash2,
    color: "#ef4444",
    bg: "#fef2f2",
  },
  DEV_WEBSITE_UPLOADED_ICON: {
    label: "Icon Uploaded",
    icon: Image,
    color: "#0891b2",
    bg: "#e0f7fa",
  },
  DEV_WEBSITE_UPDATED_ICON: {
    label: "Icon Updated",
    icon: Image,
    color: "#0891b2",
    bg: "#e0f7fa",
  },
  DEV_WEBSITE_UPLOADED_SCREENSHOTS: {
    label: "Screenshots Uploaded",
    icon: Image,
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  DEV_WEBSITE_UPDATED_SCREENSHOT: {
    label: "Screenshot Updated",
    icon: Image,
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  REVIEW_CREATED: {
    label: "Review Created",
    icon: Star,
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  REVIEW_UPDATED: {
    label: "Review Updated",
    icon: Star,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  REVIEW_DELETED: {
    label: "Review Deleted",
    icon: Star,
    color: "#ef4444",
    bg: "#fef2f2",
  },
  REPLY_CREATED: {
    label: "Reply Created",
    icon: MessageSquare,
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  REPLY_UPDATED: {
    label: "Reply Updated",
    icon: MessageSquare,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  REPLY_DELETED: {
    label: "Reply Deleted",
    icon: MessageSquare,
    color: "#ef4444",
    bg: "#fef2f2",
  },
  WISHLIST_ADDED: {
    label: "Added to Wishlist",
    icon: Heart,
    color: "#ec4899",
    bg: "#fdf2f8",
  },
  WISHLIST_REMOVED: {
    label: "Removed from Wishlist",
    icon: Heart,
    color: "#ef4444",
    bg: "#fef2f2",
  },
  PROFILE_UPDATED: {
    label: "Profile Updated",
    icon: User,
    color: "#c4956a",
    bg: "#fdf4eb",
  },
  SUPPORT_TICKET_CREATED: {
    label: "Support Ticket Created",
    icon: TicketCheck,
    color: "#0891b2",
    bg: "#e0f7fa",
  },
  DEVELOPER_APPLICATION_SUBMITTED: {
    label: "Developer Application",
    icon: ShieldCheck,
    color: "#059669",
    bg: "#ecfdf5",
  },
};

const DEFAULT_META = {
  label: "Action",
  icon: ShieldCheck,
  color: "#c4956a",
  bg: "#fdf4eb",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "DEV_WEBSITE_CREATED", label: "Created" },
  { value: "DEV_WEBSITE_UPDATED", label: "Updated" },
  { value: "DEV_WEBSITE_DELETED", label: "Deleted" },
  { value: "DEV_WEBSITE_UPLOADED_ICON", label: "Icon" },
  { value: "DEV_WEBSITE_UPLOADED_SCREENSHOTS", label: "Screenshots" },
  { value: "REVIEW_CREATED", label: "Reviews" },
  { value: "REPLY_CREATED", label: "Replies" },
  { value: "WISHLIST_ADDED", label: "Wishlist" },
  { value: "SUPPORT_TICKET_CREATED", label: "Support" },
];

const LIMIT = 16; // multiple of 4 so the last grid row fills evenly

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    return (
      <pre className="whitespace-pre-wrap break-all text-[11px] bg-[#f5efe6] rounded-md p-2 mt-1 max-w-full overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AuditCard({ log, isOpen, onToggle }) {
  const m = ACTION_META[log.action] ?? DEFAULT_META;
  const Icon = m.icon;
  const detailEntries = Object.entries(log.details ?? {});

  return (
    <div className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0">
      <button
        onClick={onToggle}
        className="flex items-start gap-3 p-4 text-left hover:bg-[#faf7f3] transition-colors"
      >
        <div
          className="size-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: m.bg }}
        >
          <Icon size={16} style={{ color: m.color }} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#1a1a1a] leading-snug">
                {m.label}
              </span>
              <ChevronDown
                size={14}
                className={`text-[#bbb] shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {log.targetModel && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: m.bg, color: m.color }}
                >
                  {log.targetModel}
                </span>
              )}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                  log.role === "admin"
                    ? "bg-purple-50 text-purple-600"
                    : "bg-[#fdf4eb] text-[#c4956a]"
                }`}
              >
                {log.role}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-[#bbb] mt-auto pt-2">
            {new Date(log.createdAt ?? log.created).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#f0ebe4] pt-3">
          <div className="space-y-2">
            {[
              ["Action", log.action],
              ["Target Model", log.targetModel],
              ["Role", log.role],
              [
                "Date",
                new Date(log.createdAt ?? log.created).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                }),
              ],
              ...detailEntries.map(([key, val]) => [
                key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
                val,
              ]),
            ].map(([label, value]) => (
              <div key={label} className="text-[12px]">
                <span className="text-[#999] font-medium">{label}</span>
                <div className="text-[#333] break-words">
                  {formatValue(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DeveloperAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Single fetch path — triggered only by [actionFilter, page] changing.
  // Filter buttons and pagination buttons only ever call setActionFilter /
  // setPage; nothing calls the fetch logic directly, so there's no
  // manual-call-vs-effect race.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = { page, limit: LIMIT };
        if (actionFilter !== "all") params.action = actionFilter;

        const res = await getMyAuditLogs(params);
        if (cancelled) return;
        const newestFirst = [...(res.data?.logs ?? [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
        setLogs(newestFirst);
        setMeta(res.data?.meta ?? null);
      } catch (err) {
        if (!cancelled) {
          setToastMessage(err.message || "Failed to load audit logs");
          setLogs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [actionFilter, page]);

  function handleFilterChange(value) {
    setActionFilter(value);
    setPage(1);
    setExpandedId(null);
  }

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  // ── Client-side search on current page ────────────────────────────────────
  const filtered = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.targetModel?.toLowerCase().includes(q) ||
      JSON.stringify(log.details ?? {})
        .toLowerCase()
        .includes(q)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
        <div className="flex items-center gap-1.5 text-[12px] text-[#888] mb-3">
          <Filter size={13} />
          Filter by action:
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                actionFilter === value
                  ? "bg-[#c4956a] text-white"
                  : "bg-[#f5efe6] text-[#888] hover:text-[#c4956a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by action, model or details…"
          className="w-full sm:w-72 border border-[#e8ddd2] rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-[#c4956a] transition-colors"
        />
      </div>

      {/* ── Count ── */}
      {!loading && (
        <p className="text-[12px] text-[#999]">
          {meta?.total ?? filtered.length} entr
          {(meta?.total ?? filtered.length) !== 1 ? "ies" : "y"}
        </p>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[#bbb] text-sm">
          No logs match your filter.
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {filtered.map((log) => (
            <AuditCard
              key={log._id}
              log={log}
              isOpen={expandedId === log._id}
              onToggle={() => toggleExpand(log._id)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="size-8 rounded-lg border border-[#e8ddd2] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5efe6] hover:border-[#c4956a] hover:text-[#c4956a] transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-[#888]">
            Page {page} of {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            className="size-8 rounded-lg border border-[#e8ddd2] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5efe6] hover:border-[#c4956a] hover:text-[#c4956a] transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

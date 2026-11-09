import { useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCcw,
  Ban,
  CheckCircle2,
  XCircle,
  Trash2,
  EyeOff,
  Eye,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { getAuditLogs } from "../../../Services/Admin/rootService";
import Toast from "../../../Components/Common/Toast";

const STATUS_STYLES = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

const LIMIT = 16; // multiple of 4 so the last grid row fills evenly

const SUMMARY_KEYS = new Set([
  "id",
  "_id",
  "action",
  "target",
  "targetName",
  "admin",
  "performedBy",
  "adminId",
  "status",
  "timestamp",
  "createdAt",
]);

function getActionStyle(action = "") {
  const a = action.toLowerCase();
  if (a.includes("delete"))
    return { icon: Trash2, color: "#dc2626", bg: "#fef2f2" };
  if (a.includes("ban") && !a.includes("unban"))
    return { icon: Ban, color: "#d97706", bg: "#fffbeb" };
  if (a.includes("unban"))
    return { icon: CheckCircle2, color: "#059669", bg: "#ecfdf5" };
  if (a.includes("approve"))
    return { icon: CheckCircle2, color: "#059669", bg: "#ecfdf5" };
  if (a.includes("reject") || a.includes("dismiss"))
    return { icon: XCircle, color: "#dc2626", bg: "#fef2f2" };
  if (a.includes("unhide"))
    return { icon: Eye, color: "#059669", bg: "#ecfdf5" };
  if (a.includes("hide"))
    return { icon: EyeOff, color: "#d97706", bg: "#fffbeb" };
  if (a.includes("demote"))
    return { icon: ArrowDownCircle, color: "#334155", bg: "#f1f5f9" };
  if (a.includes("promot"))
    return { icon: ArrowUpCircle, color: "#6366f1", bg: "#eef2ff" };
  if (a.includes("resolve"))
    return { icon: CheckCircle2, color: "#059669", bg: "#ecfdf5" };
  if (a.includes("report"))
    return { icon: ShieldAlert, color: "#dc2626", bg: "#fef2f2" };
  return { icon: Activity, color: "#334155", bg: "#f1f5f9" };
}

function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

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

function extractLogs(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.logs ?? d.auditLogs ?? [];
}

function AuditCard({ log, isOpen, onToggle }) {
  const { icon: Icon, color, bg } = getActionStyle(log.action);
  const extraEntries = Object.entries(log).filter(
    ([key, val]) => !SUMMARY_KEYS.has(key) && val !== undefined,
  );

  return (
    <div className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0">
      <button
        onClick={onToggle}
        className="flex items-start gap-3 p-4 text-left hover:bg-[#faf7f3] transition-colors"
      >
        <div
          className="size-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bg }}
        >
          <Icon size={16} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-medium text-[#1a1a1a] capitalize leading-snug">
                {(log.action || "").replaceAll("_", " ")}
              </p>
              <ChevronDown
                size={14}
                className={`text-[#bbb] shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
            <p className="text-[11px] text-[#999] truncate mt-0.5">
              {log.target || log.targetName || "—"}
            </p>
            {(log.admin || log.performedBy || log.adminId) && (
              <p className="text-[11px] text-[#bbb] truncate">
                by {log.admin || log.performedBy || log.adminId}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[log.status] || "bg-gray-50 text-gray-600"}`}
            >
              {log.status || "logged"}
            </span>
            <span className="text-[10px] text-[#bbb]">
              {log.timestamp || log.createdAt
                ? new Date(log.timestamp || log.createdAt).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )
                : "—"}
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-[#f0ebe4] pt-3">
          <div className="space-y-2">
            {[
              ["Status", log.status],
              [
                "Timestamp",
                log.timestamp || log.createdAt
                  ? new Date(log.timestamp || log.createdAt).toLocaleString(
                      "en-US",
                      {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      },
                    )
                  : null,
              ],
              ...extraEntries.map(([key, val]) => [formatKey(key), val]),
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

export default function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getAuditLogs({ page, limit: LIMIT });
        if (cancelled) return;
        setLogs(extractLogs(res));
        setTotal(res?.data?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setToastMessage(err?.message || "Failed to load audit logs");
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
  }, [page, reloadIndex]);

  const totalPages = Math.max(1, Math.ceil((total || logs.length) / LIMIT));

  function toggleExpand(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">
            Platform Audit Trail
          </h2>
        </div>
        <button
          onClick={() => setReloadIndex((i) => i + 1)}
          className="flex items-center gap-1 text-[12px] text-[#334155] hover:underline"
        >
          <RefreshCcw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          Loading audit logs…
        </p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No audit entries
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {logs.map((log) => {
            const logId = log.id || log._id;
            return (
              <AuditCard
                key={logId}
                log={log}
                isOpen={expandedId === logId}
                onToggle={() => toggleExpand(logId)}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="size-8 rounded-lg border border-[#e8ddd2] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5efe6]"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-[#888]">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="size-8 rounded-lg border border-[#e8ddd2] flex items-center justify-center disabled:opacity-30 hover:bg-[#f5efe6]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  Globe,
  Mail,
  Clock,
  EyeOff,
} from "lucide-react";
import {
  getAllReports,
  resolveReport,
  dismissReport,
  deleteReport,
} from "../../../Services/Admin/rootService";
import Toast from "../../../Components/Common/Toast";

const LIMIT = 16; // multiple of 4 so the last grid row fills evenly

const TYPE_META = {
  review: { label: "Review", icon: Star, color: "#f59e0b", bg: "#fffbeb" },
  reply: {
    label: "Reply",
    icon: MessageSquare,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  website: { label: "Website", icon: Globe, color: "#c4956a", bg: "#fdf4eb" },
};
const DEFAULT_TYPE_META = {
  label: "Content",
  icon: Flag,
  color: "#334155",
  bg: "#f1f5f9",
};

// Fields shown separately (author line, hidden/status badge) — everything
// else on the target gets walked generically below instead of guessing a
// shape per targetType. This is what actually broke last time: target for
// "website" is a raw Website doc (name/url/category/status/ownerId/
// ownerName), nothing like the review-shaped fields that were hardcoded.
const TARGET_SKIP_KEYS = new Set([
  "_id",
  "__v",
  "isHidden",
  "userId",
  "ownerId",
  "ownerName",
]);

function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    return (
      <pre className="whitespace-pre-wrap break-all text-[11px] bg-[#f5efe6] rounded-md p-2 mt-1 max-w-full overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return String(value);
}

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-gray-100 text-gray-600",
};

const REASON_LABELS = {
  spam: "Spam",
  "inappropriate content": "Inappropriate Content",
  fake: "Fake",
  harassment: "Harassment",
  "off-topic": "Off-topic",
};

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(err, fallback) {
  const msg = err?.message;
  if (typeof msg === "string" && msg) return msg;
  if (msg && typeof msg === "object" && typeof msg.message === "string")
    return msg.message;
  return fallback;
}

// The axios interceptor already unwraps to response.data, so these calls
// resolve straight to the API body: { success, message, data }. Stay
// defensive about the exact key the list lives under.
function extractReports(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.reports ?? d.data ?? [];
}

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-[#999] uppercase tracking-wide">
        {label}
      </p>
      <div className="text-[12px] text-[#333] break-words mt-0.5">
        {value ?? "—"}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  loading,
  onConfirm,
  onCancel,
}) {
  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#334155] hover:bg-[#293548]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5">
          <div
            className={`size-10 rounded-full flex items-center justify-center mb-3 ${tone === "danger" ? "bg-red-50" : "bg-[#f1f5f9]"}`}
          >
            {tone === "danger" ? (
              <Trash2 size={18} className="text-red-600" />
            ) : (
              <CheckCircle2 size={18} className="text-[#334155]" />
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">
            {title}
          </h3>
          <p className="text-[13px] text-[#666]">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white border-t border-[#e8ddd2]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-2 text-[12px] text-[#555] border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-3 py-2 text-[12px] text-white rounded-lg disabled:opacity-40 transition-colors ${confirmClasses}`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, onOpen }) {
  const meta = TYPE_META[report.targetType] || DEFAULT_TYPE_META;
  const Icon = meta.icon;

  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0 text-left hover:border-[#334155] transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="size-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: meta.bg }}
        >
          <Icon size={16} style={{ color: meta.color }} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug">
              {meta.label} reported
            </p>
            <p className="text-[11px] text-[#999] truncate mt-1">
              {report.websiteId?.name || "—"}
            </p>
            <p className="text-[11px] text-[#bbb] truncate">
              by {report.reportBy?.name || "—"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
              {REASON_LABELS[report.reason] || report.reason}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                STATUS_STYLES[report.status] || "bg-gray-50 text-gray-600"
              }`}
            >
              {report.status}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ReportDetailModal({ report, onClose, onChanged, onToast }) {
  const [resolving, setResolving] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "resolve" | "dismiss" | "delete" | null

  const meta = TYPE_META[report.targetType] || DEFAULT_TYPE_META;
  const Icon = meta.icon;
  const pending = report.status === "pending";
  const target = report.target;

  async function runAction(action) {
    const id = report._id;
    try {
      if (action === "resolve") {
        setResolving(true);
        await resolveReport(id);
        onToast("Report resolved — reported content has been hidden");
      } else if (action === "dismiss") {
        setDismissing(true);
        await dismissReport(id);
        onToast("Report dismissed");
      } else if (action === "delete") {
        setDeleting(true);
        await deleteReport(id);
        onToast("Report deleted");
      }
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Action failed"));
    } finally {
      setResolving(false);
      setDismissing(false);
      setDeleting(false);
      setConfirmAction(null);
    }
  }

  const confirmCopy = {
    resolve: {
      title: "Resolve this report?",
      message:
        "This will hide the reported content from the platform and mark the report resolved.",
      confirmLabel: "Resolve",
      tone: "primary",
    },
    dismiss: {
      title: "Dismiss this report?",
      message:
        "No action will be taken on the content — the report is closed as unfounded.",
      confirmLabel: "Dismiss",
      tone: "primary",
    },
    delete: {
      title: "Delete this report?",
      message:
        "This permanently removes the report record. This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    },
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
            <h2 className="font-semibold text-[#1a1a1a] text-base">
              Report Details
            </h2>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* ── Type + badges ── */}
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: meta.bg }}
                >
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <p className="flex-1 min-w-0 text-[14px] font-semibold text-[#1a1a1a] leading-snug break-words">
                  {meta.label} on {report.websiteId?.name || "a website"}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
                  {REASON_LABELS[report.reason] || report.reason}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                    STATUS_STYLES[report.status] || "bg-gray-50 text-gray-600"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {report.additionalText && (
                <p className="text-[13px] text-[#333] whitespace-pre-wrap break-words mt-3">
                  {report.additionalText}
                </p>
              )}
            </div>

            {/* ── Reporter ── */}
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
              <p className="text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                Reported By
              </p>
              <p className="text-[13px] font-medium text-[#1a1a1a] break-words">
                {report.reportBy?.name || "—"}
              </p>
              <p className="text-[12px] text-[#888] flex items-center gap-1 mt-0.5 min-w-0">
                <Mail size={12} className="shrink-0" />
                <span className="break-all">
                  {report.reportBy?.email || "—"}
                </span>
              </p>
            </div>

            {/* ── Reported content ── */}
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-[11px] font-medium text-[#999] uppercase tracking-wide">
                  Reported Content
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {target?.isHidden && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      <EyeOff size={10} /> Already Hidden
                    </span>
                  )}
                  {target?.status && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#f1f5f9] text-[#334155] capitalize">
                      {target.status}
                    </span>
                  )}
                </div>
              </div>

              {!target ? (
                <p className="text-[12px] text-[#bbb]">
                  Original content is no longer available.
                </p>
              ) : (
                <div className="space-y-2">
                  {(target.userId?.name || target.ownerName) && (
                    <p className="text-[11px] text-[#999]">
                      By {target.userId?.name || target.ownerName}
                      {target.userId?.email && ` · ${target.userId.email}`}
                    </p>
                  )}
                  {Object.entries(target)
                    .filter(
                      ([key, val]) =>
                        !TARGET_SKIP_KEYS.has(key) &&
                        val !== undefined &&
                        val !== "",
                    )
                    .map(([key, val]) => (
                      <DetailRow
                        key={key}
                        label={formatKey(key)}
                        value={formatValue(val)}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* ── Timeline ── */}
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-3">
                <Clock size={12} /> Timeline
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <DetailRow
                  label="Reported"
                  value={formatDateTime(report.createdAt)}
                />
                <DetailRow
                  label="Last Updated"
                  value={formatDateTime(report.updatedAt)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-4 bg-white border-t border-[#e8ddd2] shrink-0">
            <button
              onClick={() => setConfirmAction("delete")}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
            >
              <Trash2 size={13} /> Delete
            </button>

            {pending && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setConfirmAction("dismiss")}
                  disabled={dismissing}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-[#555] bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                >
                  <XCircle size={13} /> Dismiss
                </button>
                <button
                  onClick={() => setConfirmAction("resolve")}
                  disabled={resolving}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-white bg-[#334155] hover:bg-[#293548] rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                >
                  <CheckCircle2 size={13} /> Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          {...confirmCopy[confirmAction]}
          loading={resolving || dismissing || deleting}
          onConfirm={() => runAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}

export default function AdminReports() {
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [openReport, setOpenReport] = useState(null);

  // Single fetch path — triggered only by [page, reloadIndex] changing.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getAllReports({ page, limit: LIMIT });
        if (cancelled) return;
        setReports(extractReports(res));
        setTotal(res?.data?.total ?? res?.data?.meta?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setToastMessage(getErrorMessage(err, "Failed to load reports"));
          setReports([]);
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

  const totalPages = Math.max(1, Math.ceil((total || reports.length) / LIMIT));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">Reports</h2>
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
          Loading reports…
        </p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No reports filed
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {reports.map((r) => (
            <ReportCard
              key={r._id}
              report={r}
              onOpen={() => setOpenReport(r)}
            />
          ))}
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

      {openReport && (
        <ReportDetailModal
          report={openReport}
          onClose={() => setOpenReport(null)}
          onChanged={() => setReloadIndex((i) => i + 1)}
          onToast={setToastMessage}
        />
      )}
    </div>
  );
}

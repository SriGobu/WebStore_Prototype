import { useEffect, useState } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Search,
  Mail,
  Clock,
  X,
} from "lucide-react";
import {
  getAllPromotions,
  approvePromotion,
  rejectPromotion,
} from "../../../Services/Admin/rootService";
import Toast from "../../../Components/Common/Toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(err, fallback) {
  const msg = err?.message;
  if (typeof msg === "string" && msg) return msg;
  return fallback;
}

function extractList(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.promotions ?? d.requests ?? d.data ?? [];
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Confirm dialog (same as AdminDevelopers) ─────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "danger",
  loading,
  onConfirm,
  onCancel,
  children,
}) {
  const confirmClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5">
          <div
            className={`size-10 rounded-full flex items-center justify-center mb-3 ${
              tone === "danger" ? "bg-red-50" : "bg-emerald-50"
            }`}
          >
            {tone === "danger" ? (
              <XCircle size={18} className="text-red-600" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-600" />
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">
            {title}
          </h3>
          <p className="text-[13px] text-[#666] mb-3">{message}</p>
          {children}
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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

// ─── Promotion card ───────────────────────────────────────────────────────────

function PromotionCard({ request, onOpen }) {
  const initial = request?.userId?.name?.charAt(0)?.toUpperCase() || "?";
  const isPending = !request.status || request.status === "pending";

  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0 text-left hover:border-[#334155] transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="size-9 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-semibold">{initial}</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug truncate">
              {request.userId?.name}
            </p>
            <p className="text-[11px] text-[#999] truncate mt-0.5">
              {request.userId?.email}
            </p>
            {request.createdAt && (
              <p className="text-[10px] text-[#bbb] mt-0.5">
                {formatDate(request.createdAt)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <StatusBadge status={request.status ?? "pending"} />
            {isPending && (
              <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                <Clock size={10} /> Pending
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function PromotionDetailModal({ request, onClose, onApprove, onReject, busy }) {
  const [confirmAction, setConfirmAction] = useState(null); // "approve" | "reject"
  const [rejectReason, setRejectReason] = useState("");

  const rid = request?.id ?? request?._id;
  const isPending = !request.status || request.status === "pending";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
            <h2 className="font-semibold text-[#1a1a1a] text-base">
              Promotion Request
            </h2>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* User info */}
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {request.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">
                    {request.userId?.name}
                  </p>
                  <p className="text-[12px] text-[#888] flex items-center gap-1 mt-0.5">
                    <Mail size={12} className="shrink-0" />
                    <span className="break-all">{request.userId?.email}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusBadge status={request.status ?? "pending"} />
                    {request.createdAt && (
                      <span className="text-[10px] text-[#bbb] flex items-center gap-0.5">
                        <Clock size={10} /> {formatDate(request.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
              <p className="text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                Why they want to become a developer
              </p>
              <p className="text-[13px] text-[#444] leading-relaxed">
                {request.reason ?? "No reason provided."}
              </p>
            </div>

            {/* Rejection reason if already rejected */}
            {request.status === "rejected" && request.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-[11px] font-medium text-red-600 uppercase tracking-wide mb-1">
                  Rejection Reason
                </p>
                <p className="text-[13px] text-red-700">
                  {request.rejectionReason}
                </p>
              </div>
            )}

            {/* Approval notes if already approved */}
            {request.status === "approved" && request.approvalNotes && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide mb-1">
                  Approval Notes
                </p>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[11px] font-medium text-[#999] uppercase tracking-wide">
                    Reviewed by : {request.reviewedBy}
                  </p>
                  <span className="text-[10px] text-[#bbb] flex items-center gap-1">
                    <Clock size={10} /> {formatDate(request.createdAt)}
                  </span>
                </div>
                <p className="text-[13px] text-emerald-700">
                  {request.approvalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Actions — only if pending */}
          {isPending && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 bg-white border-t border-[#e8ddd2] shrink-0">
              <button
                onClick={() => setConfirmAction("reject")}
                disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-40 transition-colors"
              >
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => setConfirmAction("approve")}
                disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-40 transition-colors"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Approve confirm */}
      {confirmAction === "approve" && (
        <ConfirmDialog
          title="Approve this promotion?"
          message="The user will be promoted to developer and gain access to the developer portal."
          confirmLabel="Approve"
          tone="success"
          loading={busy}
          onConfirm={() => onApprove(rid)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Reject confirm with reason input */}
      {confirmAction === "reject" && (
        <ConfirmDialog
          title="Reject this promotion?"
          message="Provide a reason so the user understands why."
          confirmLabel="Reject"
          tone="danger"
          loading={busy}
          onConfirm={() => {
            if (rejectReason.trim().length < 20) return;
            onReject(rid, rejectReason.trim());
          }}
          onCancel={() => {
            setConfirmAction(null);
            setRejectReason("");
          }}
        >
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (min 20 characters)…"
            rows={3}
            className="w-full border border-[#e8ddd2] rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-[#334155] bg-white transition-colors"
          />
          {rejectReason.trim().length > 0 &&
            rejectReason.trim().length < 20 && (
              <p className="text-[11px] text-red-500 mt-1">
                At least 20 characters required ({rejectReason.trim().length}
                /20)
              </p>
            )}
        </ConfirmDialog>
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPromotions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [openRequest, setOpenRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getAllPromotions();
        if (cancelled) return;
        setRequests(extractList(res));
      } catch (err) {
        if (!cancelled)
          setToastMessage(
            getErrorMessage(err, "Failed to load promotion requests"),
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadIndex]);

  async function handleApprove(id) {
    setBusy(true);
    try {
      await approvePromotion(id, {});
      setToastMessage("Promotion approved");
      setOpenRequest(null);
      setReloadIndex((i) => i + 1);
    } catch (err) {
      setToastMessage(getErrorMessage(err, "Approve failed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(id, rejectionReason) {
    setBusy(true);
    try {
      await rejectPromotion(id, { rejectionReason });
      setToastMessage("Promotion rejected");
      setOpenRequest(null);
      setReloadIndex((i) => i + 1);
    } catch (err) {
      setToastMessage(getErrorMessage(err, "Reject failed"));
    } finally {
      setBusy(false);
    }
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = requests.filter((r) => {
    const matchStatus =
      statusFilter === "all" || (r.status ?? "pending") === statusFilter;
    const matchSearch =
      !search.trim() ||
      r.userId.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.userId.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = requests.filter(
    (r) => !r.status || r.status === "pending",
  ).length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpCircle size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">
            Promotion Requests
          </h2>
        </div>
        <button
          onClick={() => setReloadIndex((i) => i + 1)}
          className="flex items-center gap-1 text-[12px] text-[#334155] hover:underline"
        >
          <RefreshCcw size={12} /> Refresh
        </button>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "pending", label: `Pending`, count: pendingCount },
          { id: "approved", label: `Approved`, count: approvedCount },
          { id: "rejected", label: `Rejected`, count: rejectedCount },
          { id: "all", label: `All`, count: requests.length },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setStatusFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
              statusFilter === id
                ? "bg-[#334155] text-white border-[#334155]"
                : "bg-white text-[#555] border-[#e8ddd2] hover:bg-[#f1f5f9]"
            }`}
          >
            {label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === id
                  ? "bg-white/20 text-white"
                  : "bg-[#f1f5f9] text-[#888]"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput.trim());
        }}
        className="flex items-center gap-2 max-w-md"
      >
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-8 pr-3 py-2 text-sm border border-[#e8ddd2] rounded-lg outline-none focus:border-[#334155] bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 text-sm bg-[#334155] text-white rounded-lg hover:bg-[#293548]"
        >
          Search
        </button>
      </form>

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          Loading requests…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No requests found
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {filtered.map((r) => (
            <PromotionCard
              key={r.id ?? r._id}
              request={r}
              onOpen={() => setOpenRequest(r)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {openRequest && (
        <PromotionDetailModal
          request={openRequest}
          onClose={() => setOpenRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          busy={busy}
        />
      )}
    </div>
  );
}

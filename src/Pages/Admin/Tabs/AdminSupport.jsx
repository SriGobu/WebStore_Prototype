import { useEffect, useState } from "react";
import {
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
  Send,
  Trash2,
  Bug,
  Sparkles,
  Globe,
  UserCog,
  CreditCard,
  HelpCircle,
  Clock,
  Mail,
} from "lucide-react";
import {
  getAllTickets,
  getTicketById,
  resolveTicket,
  deleteTicket,
} from "../../../Services/Admin/rootService";
import Toast from "../../../Components/Common/Toast";

const LIMIT = 16; // multiple of 4 so the last grid row fills evenly

const REASON_META = {
  general_inquiry: {
    label: "General Inquiry",
    icon: HelpCircle,
    color: "#334155",
    bg: "#f1f5f9",
  },
  bug_report: {
    label: "Bug Report",
    icon: Bug,
    color: "#dc2626",
    bg: "#fef2f2",
  },
  feature_request: {
    label: "Feature Request",
    icon: Sparkles,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  website_approval_issue: {
    label: "Website Approval",
    icon: Globe,
    color: "#c4956a",
    bg: "#fdf4eb",
  },
  account_problems: {
    label: "Account Problems",
    icon: UserCog,
    color: "#d97706",
    bg: "#fffbeb",
  },
  billing_and_payment: {
    label: "Billing & Payment",
    icon: CreditCard,
    color: "#059669",
    bg: "#ecfdf5",
  },
  other: { label: "Other", icon: HelpCircle, color: "#334155", bg: "#f1f5f9" },
};
const DEFAULT_REASON_META = {
  label: "Other",
  icon: HelpCircle,
  color: "#334155",
  bg: "#f1f5f9",
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

// adminResponse comes back shaped like { message: "..." } (matching the
// { message } payload resolveTicket sends), not a plain string — pull the
// text out defensively so a string is still handled if the shape changes.
function getResponseText(adminResponse) {
  if (!adminResponse) return null;
  if (typeof adminResponse === "string") return adminResponse;
  return adminResponse.message ?? null;
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
// defensive about the exact key the list/record lives under.
function extractTickets(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.tickets ?? d.data ?? [];
}
function extractTicket(res) {
  const d = res?.data;
  if (!d) return null;
  return d.ticket ?? (Array.isArray(d) ? d[0] : d);
}

function TicketCard({ ticket, onOpen }) {
  const meta = REASON_META[ticket.reason] || DEFAULT_REASON_META;
  const Icon = meta.icon;
  const resolved = ticket.status === "resolved";

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
            <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug line-clamp-2 break-words">
              {ticket.subject}
            </p>
            <p className="text-[11px] text-[#999] truncate mt-1">
              {ticket.userId?.name || "—"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                resolved
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {resolved ? "Resolved" : "Open"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  loading,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5">
          <div className="size-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Trash2 size={18} className="text-red-600" />
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
            className="px-3 py-2 text-[12px] text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-40 transition-colors"
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-[#999] uppercase tracking-wide">
        {label}
      </p>
      <p className="text-[12px] text-[#333] break-words mt-0.5">
        {value ?? "—"}
      </p>
    </div>
  );
}

function TicketDetailModal({ ticketId, onClose, onChanged, onToast }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Single fetch path for the detail record, keyed only on ticketId.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getTicketById(ticketId);
        if (cancelled) return;
        setTicket(extractTicket(res));
      } catch (err) {
        if (!cancelled) onToast(getErrorMessage(err, "Failed to load ticket"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticketId, onToast]);

  async function handleResolve() {
    if (message.trim().length < 10) {
      onToast("Response message must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      await resolveTicket(ticketId, { message: message.trim() });
      onToast("Response sent and ticket resolved");
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Failed to send response"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTicket(ticketId);
      onToast("Ticket deleted");
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Failed to delete ticket"));
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const meta = ticket
    ? REASON_META[ticket.reason] || DEFAULT_REASON_META
    : DEFAULT_REASON_META;
  const Icon = meta.icon;
  const resolved = ticket?.status === "resolved";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
            <h2 className="font-semibold text-[#1a1a1a] text-base">
              Ticket Details
            </h2>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {loading ? (
              <p className="text-sm text-[#bbb] text-center py-10">
                Loading ticket…
              </p>
            ) : !ticket ? (
              <p className="text-sm text-red-500 text-center py-10">
                Ticket not found
              </p>
            ) : (
              <>
                {/* ── Subject + badges ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: meta.bg }}
                    >
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <p className="flex-1 min-w-0 text-[14px] font-semibold text-[#1a1a1a] leading-snug break-words">
                      {ticket.subject}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        resolved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {resolved ? "Resolved" : "Open"}
                    </span>
                  </div>
                </div>

                {/* ── Requester ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <p className="text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                    Requester
                  </p>
                  <p className="text-[13px] font-medium text-[#1a1a1a] break-words">
                    {ticket.userId?.name || "—"}
                  </p>
                  <p className="text-[12px] text-[#888] flex items-center gap-1 mt-0.5 min-w-0">
                    <Mail size={12} className="shrink-0" />
                    <span className="break-all">
                      {ticket.userId?.email || "—"}
                    </span>
                  </p>
                </div>

                {/* ── Description ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <p className="text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                    Description
                  </p>
                  <p className="text-[13px] text-[#333] whitespace-pre-wrap break-words">
                    {ticket.description}
                  </p>
                </div>

                {/* ── Timestamps — responsive grid so it doesn't overflow on mobile ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-3">
                    <Clock size={12} /> Timeline
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                    <DetailRow
                      label="Created"
                      value={formatDateTime(ticket.createdAt)}
                    />
                    <DetailRow
                      label="Last Updated"
                      value={formatDateTime(ticket.updatedAt)}
                    />
                    {resolved && (
                      <DetailRow
                        label="Responded"
                        value={formatDateTime(
                          ticket.adminResponse?.respondedAt,
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* ── Admin response ── */}
                {resolved && getResponseText(ticket.adminResponse) && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide mb-1">
                      Admin Response
                    </p>
                    <p className="text-[13px] text-[#333] whitespace-pre-wrap break-words">
                      {getResponseText(ticket.adminResponse)}
                    </p>
                  </div>
                )}

                {!resolved && (
                  <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                    <label className="block text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                      Send a response
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Write a response to resolve this ticket (min 10 characters)…"
                      className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155] resize-none"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {!loading && ticket && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-4 bg-white border-t border-[#e8ddd2] shrink-0">
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
              >
                <Trash2 size={13} /> Delete
              </button>
              {!resolved && (
                <button
                  onClick={handleResolve}
                  disabled={submitting}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-white bg-[#334155] hover:bg-[#293548] rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                >
                  <Send size={13} />{" "}
                  {submitting ? "Sending…" : "Send Response & Resolve"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Delete this ticket?"
          message="This will permanently remove the ticket and its response history. This cannot be undone."
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}

export default function AdminSupport() {
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [openTicketId, setOpenTicketId] = useState(null);

  // Single fetch path — triggered only by [page, reloadIndex] changing.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getAllTickets({ page, limit: LIMIT });
        if (cancelled) return;
        setTickets(extractTickets(res));
        setTotal(res?.data?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setToastMessage(getErrorMessage(err, "Failed to load tickets"));
          setTickets([]);
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

  const totalPages = Math.max(1, Math.ceil((total || tickets.length) / LIMIT));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LifeBuoy size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">
            Support Tickets
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
          Loading tickets…
        </p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No support tickets
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {tickets.map((t) => (
            <TicketCard
              key={t._id}
              ticket={t}
              onOpen={() => setOpenTicketId(t._id)}
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

      {openTicketId && (
        <TicketDetailModal
          ticketId={openTicketId}
          onClose={() => setOpenTicketId(null)}
          onChanged={() => setReloadIndex((i) => i + 1)}
          onToast={setToastMessage}
        />
      )}
    </div>
  );
}

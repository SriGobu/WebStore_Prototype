import { useState, useEffect } from "react";
import { Mail, SendHorizontal } from "lucide-react";
import {
  submitTicket,
  getMyTickets,
  deleteMyTicket,
} from "../../../Services/Developer/supportService";
import Toast from "../../../Components/Common/Toast";
import ReasonSelect from "../../../Components/Common/ReasonSelect";

const REASONS = [
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "website_approval_issue", label: "Website Approval Issue" },
  { value: "account_problems", label: "Account Problem" },
  { value: "billing_and_payment", label: "Billing / Payments" },
  { value: "other", label: "Other" },
];

const REASON_LABEL = Object.fromEntries(
  REASONS.map(({ value, label }) => [value, label]),
);

function StatusBadge({ status }) {
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
        status === "resolved"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {status}
    </span>
  );
}

function ReasonBadge({ reason }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8dfd4] text-[#767676]">
      {REASON_LABEL[reason] ?? reason}
    </span>
  );
}

export default function DeveloperSupport() {
  const [form, setForm] = useState({
    subject: "",
    reason: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastTicketId, setLastTicketId] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getMyTickets();
        if (!cancelled) setTickets(res.data?.tickets ?? []);
      } catch (err) {
        if (!cancelled)
          setToastMessage(err.message || "Failed to load tickets");
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.subject.trim() || !form.reason || !form.description.trim())
      return;
    setSubmitting(true);
    try {
      const res = await submitTicket(form);
      setLastTicketId(res.data?.ticketId);
      setSubmitted(true);
      const updated = await getMyTickets();
      setTickets(updated.data?.tickets ?? []);
    } catch (err) {
      setToastMessage(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm({ subject: "", reason: "", description: "" });
    setSubmitted(false);
    setLastTicketId(null);
  }

  async function handleDeleteTicket(ticketId) {
    setDeletingId(ticketId);
    try {
      await deleteMyTicket(ticketId);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      setToastMessage("Ticket deleted");
      setShowDeleteConfirm(null);
    } catch (err) {
      setToastMessage(err.message || "Failed to delete ticket");
    } finally {
      setDeletingId(null);
    }
  }

  const inputClass =
    "w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-[#111] placeholder:text-[#b0a898] focus:outline-none focus:border-[#c4956a] transition-colors";

  return (
    /* ── Full-height scroll container — browser never scrolls, this div does ── */
    <div className="overflow-y-auto">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="max-w-2xl mx-auto space-y-4 px-2 py-2">
        {/* ── Contact Admin Form ── */}
        <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#e0d9d0]">
            <div className="size-10 bg-[#c4956a] rounded-xl flex items-center justify-center shrink-0">
              <Mail className="text-white text-xl" />
            </div>
            <div>
              <h2 className="font-semibold text-[#111] text-lg">
                Contact Admin
              </h2>
              <p className="font-light text-[#767676] text-xs mt-0.5">
                We'll get back to you within 24–48 hours
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-10">
              <div className="size-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <p className="font-semibold text-[#111] text-base mb-1">
                Message Sent!
              </p>
              <p className="font-light text-[#767676] text-sm mb-1">
                Your ticket has been received.
              </p>
              {lastTicketId && (
                <p className="font-light text-[#767676] text-xs mb-5">
                  Ticket ID:{" "}
                  <span className="text-[#c4956a] font-medium">
                    {lastTicketId}
                  </span>
                </p>
              )}
              <button
                onClick={handleReset}
                className="text-[#c4956a] text-sm font-semibold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* To (readonly) */}
              <div>
                <label className="font-medium text-[#333] text-sm mb-1.5 block">
                  To
                </label>
                <input
                  type="text"
                  value="webstore.officials@gmail.com"
                  readOnly
                  className="w-full bg-[#f0ece7] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-[#767676] cursor-not-allowed"
                />
              </div>

              {/* Subject + Reason side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#333] text-sm mb-1.5 block">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    placeholder="Brief subject of your message"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="font-medium text-[#333] text-sm mb-1.5 block">
                    Reason
                  </label>
                  <ReasonSelect
                    value={form.reason}
                    onChange={(v) => set("reason", v)}
                    options={REASONS}
                  />
                </div>
              </div>

              {/* Message — capped height, scrolls internally */}
              <div>
                <label className="font-medium text-[#333] text-sm mb-1.5 block">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  rows={5}
                  className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-[#111] placeholder:text-[#b0a898] resize-none focus:outline-none focus:border-[#c4956a] transition-colors max-h-36 overflow-y-auto"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !form.subject.trim() ||
                  !form.reason ||
                  !form.description.trim()
                }
                className="w-full bg-[#c4956a] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <SendHorizontal className="text-white" />
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          )}
        </div>

        {/* ── My Tickets — collapsible ── */}
        <div className="bg-[#fafafa] rounded-xl shadow-md overflow-hidden">
          {/* Dropdown header */}
          <button
            onClick={() => setTicketsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#f5efe6] transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-[#111] text-base">
                My Tickets
              </h2>
              {!ticketsLoading && (
                <span className="text-[11px] font-medium bg-[#e8dfd4] text-[#767676] px-2 py-0.5 rounded-full">
                  {tickets.length}
                </span>
              )}
            </div>

            {/* Chevron */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              className={`fill-none stroke-[#767676] transition-transform duration-200 ${
                ticketsOpen ? "rotate-180" : ""
              }`}
              style={{ strokeWidth: 2 }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Collapsible body — max height + internal scroll so it never pushes the page */}
          {ticketsOpen && (
            <div className="px-6 pb-6 border-t border-[#e0d9d0]">
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="inline-block w-5 h-5 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <p className="font-light text-[#767676] text-sm text-center py-8">
                  No tickets yet. Send a message above.
                </p>
              ) : (
                /* ── Ticket list scrolls internally, max ~3 tickets visible ── */
                <div className="space-y-3 pt-4 max-h-72 overflow-y-auto pr-1">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={ticket.status} />
                          {ticket.reason && (
                            <ReasonBadge reason={ticket.reason} />
                          )}
                        </div>
                        {ticket.status === "open" && (
                          <button
                            onClick={() => setShowDeleteConfirm(ticket._id)}
                            className="text-red-500 text-xs hover:underline shrink-0"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="font-semibold text-[#111] text-sm mb-1">
                        {ticket.subject}
                      </p>
                      <p className="font-light text-[#333] text-xs line-clamp-2">
                        {typeof ticket.description === "string"
                          ? ticket.description
                          : (ticket.description?.message ?? "")}
                      </p>
                      {ticket.adminResponse?.message && (
                        <div className="mt-3 pt-3 border-t border-[#e0d9d0]">
                          <p className="text-[10px] text-[#c4956a] font-semibold mb-1">
                            Admin Response
                          </p>
                          <p className="font-light text-[#333] text-xs">
                            {ticket.adminResponse.message}
                          </p>
                        </div>
                      )}
                      <p className="font-light text-[#767676] text-[10px] mt-2">
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-[#111] text-base mb-2">
              Delete Ticket?
            </h3>
            <p className="font-light text-[#767676] text-sm mb-6">
              This ticket will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={!!deletingId}
                className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTicket(showDeleteConfirm)}
                disabled={!!deletingId}
                className="flex-1 bg-red-500 py-2 rounded-xl font-semibold text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

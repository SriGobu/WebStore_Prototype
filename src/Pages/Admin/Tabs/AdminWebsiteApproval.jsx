import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
  CheckCircle2,
  XCircle,
  Trash2,
  Pencil,
  Globe,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import {
  getPendingWebsites,
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
  approveWebsite,
  rejectWebsite,
  recheckWebsiteHealth,
} from "../../../Services/Admin/rootService";
import Toast from "../../../Components/Common/Toast";

const LIMIT = 16; // multiple of 4 so the last grid row fills evenly

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
// defensive about the exact key the list/record lives under.
function extractWebsites(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.websites ?? d.data ?? [];
}
function extractWebsite(res) {
  const d = res?.data;
  if (!d) return null;
  return d.website ?? (Array.isArray(d) ? d[0] : d);
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

function HealthBadge({ health }) {
  if (!health)
    return <span className="text-[10px] text-gray-500">Not Checked</span>;

  const map = {
    healthy: {
      color: "bg-green-50 text-green-700",
      text: "Healthy",
    },

    redirect: {
      color: "bg-blue-50 text-blue-700",
      text: "Redirect",
    },

    client_error: {
      color: "bg-orange-50 text-orange-700",
      text: "4xx Error",
    },

    server_error: {
      color: "bg-red-50 text-red-700",
      text: "5xx Error",
    },

    timeout: {
      color: "bg-red-50 text-red-700",
      text: "Timeout",
    },

    dns_error: {
      color: "bg-red-50 text-red-700",
      text: "DNS Error",
    },

    ssl_error: {
      color: "bg-red-50 text-red-700",
      text: "SSL Error",
    },

    unreachable: {
      color: "bg-red-50 text-red-700",
      text: "Offline",
    },

    pending: {
      color: "bg-gray-100 text-gray-600",
      text: "Pending",
    },
  };

  const item = map[health.status] || map.pending;

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.color}`}
    >
      {item.text}
    </span>
  );
}

function WebsiteCard({ site, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0 text-left hover:border-[#334155] transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="size-9 rounded-lg bg-[#f1f5f9] shrink-0 overflow-hidden flex items-center justify-center">
          {site.icon?.url ? (
            <img
              src={site.icon.url}
              alt={site.name}
              className="size-full object-cover"
            />
          ) : (
            <Globe size={16} className="text-[#334155]" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug truncate">
              {site.name}
            </p>
            <p className="text-[11px] text-[#999] truncate mt-0.5 capitalize">
              {site.category}
            </p>
            <p className="text-[11px] text-[#bbb] truncate">{site.ownerName}</p>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700">
              Pending
            </span>
            <HealthBadge health={site.healthCheck} />
            <span className="text-[10px] text-[#bbb]">
              {site.createdAt
                ? new Date(site.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EditForm({ site, onCancel, onSaved, onToast }) {
  const [form, setForm] = useState({
    name: site.name || "",
    url: site.url || "",
    category: site.category || "",
    description: site.description || "",
    tags: (site.tags || []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (form.name.trim().length < 3) {
      onToast("Name must be at least 3 characters");
      return;
    }
    if (form.description.trim().length < 10) {
      onToast("Description must be at least 10 characters");
      return;
    }
    setSaving(true);
    try {
      await updateWebsite(site._id, {
        name: form.name.trim(),
        url: form.url.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onToast("Website updated");
      onSaved();
    } catch (err) {
      onToast(getErrorMessage(err, "Update failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8ddd2] p-4 space-y-3">
      <div>
        <label className="block text-[10px] font-medium text-[#999] uppercase tracking-wide mb-1">
          Name
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155]"
        />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-[#999] uppercase tracking-wide mb-1">
          URL
        </label>
        <input
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155]"
        />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-[#999] uppercase tracking-wide mb-1">
          Category
        </label>
        <input
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155]"
        />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-[#999] uppercase tracking-wide mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={4}
          className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155] resize-none"
        />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-[#999] uppercase tracking-wide mb-1">
          Tags (comma separated)
        </label>
        <input
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155]"
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-2 text-[12px] text-[#555] border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] disabled:opacity-40 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-[12px] text-white bg-[#334155] hover:bg-[#293548] rounded-lg disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function WebsiteDetailModal({ websiteId, onClose, onChanged, onToast }) {
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejectingLoading, setRejectingLoading] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getWebsiteById(websiteId);
        if (cancelled) return;
        setSite(extractWebsite(res));
      } catch (err) {
        if (!cancelled) onToast(getErrorMessage(err, "Failed to load website"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [websiteId, onToast]);

  async function handleApprove() {
    setApproving(true);
    try {
      await approveWebsite(websiteId);
      onToast("Website approved");
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Approve failed"));
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (rejectionReason.trim().length < 10) {
      onToast("Rejection reason must be at least 10 characters");
      return;
    }
    setRejectingLoading(true);
    try {
      await rejectWebsite(websiteId, {
        rejectionReason: rejectionReason.trim(),
      });
      onToast("Website rejected");
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Reject failed"));
    } finally {
      setRejectingLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteWebsite(websiteId);
      onToast("Website deleted");
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Delete failed"));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function handleSaved() {
    setEditing(false);
    // reload the record so the summary reflects the edit
    getWebsiteById(websiteId)
      .then((res) => setSite(extractWebsite(res)))
      .catch(() => {});
    onChanged();
  }

  async function handleRecheck() {
    setRechecking(true);
    try {
      const res = await recheckWebsiteHealth(websiteId);
      const healthCheck = res?.data?.healthCheck;

      if (!res?.success || !healthCheck) {
        onToast(getErrorMessage(res, "Health check could not be completed"));
        return;
      }

      setSite((prev) => (prev ? { ...prev, healthCheck } : prev));
      onToast("Health check completed");
    } catch (err) {
      onToast(getErrorMessage(err, "Health check failed"));
    } finally {
      setRechecking(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
            <h2 className="font-semibold text-[#1a1a1a] text-base">
              Website Request
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
                Loading website…
              </p>
            ) : !site ? (
              <p className="text-sm text-red-500 text-center py-10">
                Website not found
              </p>
            ) : editing ? (
              <EditForm
                site={site}
                onCancel={() => setEditing(false)}
                onSaved={handleSaved}
                onToast={onToast}
              />
            ) : (
              <>
                {/* ── Summary ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="size-12 rounded-xl bg-[#f1f5f9] shrink-0 overflow-hidden flex items-center justify-center">
                      {site.icon?.url ? (
                        <img
                          src={site.icon.url}
                          alt={site.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Globe size={22} className="text-[#334155]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#1a1a1a] break-words">
                        {site.name}
                      </p>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[12px] text-[#334155] flex items-center gap-1 hover:underline break-all"
                      >
                        {site.url}{" "}
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    </div>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8ddd2] text-[#555] hover:border-[#334155] hover:text-[#334155] transition-colors shrink-0"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <DetailRow
                      label="Category"
                      value={
                        <span className="capitalize">{site.category}</span>
                      }
                    />
                    <DetailRow label="Owner" value={site.ownerName} />
                    <DetailRow
                      label="Submitted"
                      value={formatDateTime(site.createdAt)}
                    />
                    <DetailRow
                      label="Last Updated"
                      value={formatDateTime(site.updatedAt)}
                    />
                    <DetailRow
                      label="Health"
                      value={site.healthCheck?.status || "Not Checked"}
                    />
                    <DetailRow
                      label="Status Code"
                      value={site.healthCheck?.statusCode || "—"}
                    />
                    <DetailRow
                      label="Response Time"
                      value={
                        site.healthCheck?.responseTime
                          ? `${site.healthCheck.responseTime} ms`
                          : "—"
                      }
                    />
                    <DetailRow
                      label="Checked At"
                      value={formatDateTime(site.healthCheck?.checkedAt)}
                    />
                  </div>

                  {site.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {site.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-[#f1f5f9] text-[#555] px-2 py-0.5 rounded-full capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-1 border border-[#e8ddd2] rounded-lg p-3 mb-3">
                    <p className="text-[10px] font-medium text-[#999] uppercase tracking-wide mb-1.5">
                      Description
                    </p>
                    <p className="text-[13px] leading-relaxed text-[#333] whitespace-pre-wrap break-words">
                      {site.description}
                    </p>
                  </div>

                  {site.healthCheck?.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700">
                        Health Check Error
                      </p>

                      <p className="text-xs text-red-600 mt-1">
                        {site.healthCheck.error}
                      </p>
                    </div>
                  )}

                  {site.healthCheck && !site.healthCheck?.error && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700">
                        Health Check Successful
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Screenshots ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-3">
                    <ImageIcon size={12} /> Screenshots
                  </div>
                  {!site.screenshots || site.screenshots.length === 0 ? (
                    <p className="text-[12px] text-[#bbb] text-center py-4">
                      No screenshots uploaded.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {site.screenshots.map((shot, i) => (
                        <div
                          key={shot._id ?? i}
                          className="aspect-video rounded-lg overflow-hidden bg-[#f1f5f9] border border-[#e8ddd2]"
                        >
                          <img
                            src={shot.url}
                            alt={`screenshot ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Reject reason input, shown when rejecting ── */}
                {rejecting && (
                  <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                    <label className="block text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                      Reason for rejection
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this submission is being rejected (min 10 characters)…"
                      className="w-full text-[13px] border border-[#e8ddd2] rounded-lg px-3 py-2 outline-none focus:border-[#334155] resize-none"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {!loading && site && !editing && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-4 bg-white border-t border-[#e8ddd2] shrink-0">
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={
                  approving || rejectingLoading || rechecking || deleting
                }
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
              >
                <Trash2 size={13} /> Delete
              </button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {rejecting ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejecting(false);
                        setRejectionReason("");
                      }}
                      disabled={
                        approving || rejectingLoading || rechecking || deleting
                      }
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-[#555] bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={rejectingLoading}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                    >
                      <XCircle size={13} />{" "}
                      {rejectingLoading ? "Rejecting…" : "Confirm Reject"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleRecheck}
                      disabled={rechecking}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px]
               text-[#334155] bg-[#f1f5f9]
               hover:bg-[#e2e8f0]
               rounded-lg disabled:opacity-40 transition-colors
               w-full sm:w-auto"
                    >
                      <RefreshCcw size={13} />
                      {rechecking ? "Checking..." : "Recheck"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejecting(true)}
                      disabled={rejectingLoading}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-white bg-[#334155] hover:bg-[#293548] rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                    >
                      <CheckCircle2 size={13} />{" "}
                      {approving ? "Approving…" : "Approve"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this website?"
          message="This permanently removes the submission. This cannot be undone."
          confirmLabel="Delete"
          tone="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

export default function AdminWebsiteRequests() {
  const [page, setPage] = useState(1);
  const [sites, setSites] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [openId, setOpenId] = useState(null);

  // Single fetch path — triggered only by [page, reloadIndex] changing.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getPendingWebsites({ page, limit: LIMIT });
        if (cancelled) return;
        setSites(extractWebsites(res));
        setTotal(res?.data?.total ?? res?.data?.meta?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setToastMessage(
            getErrorMessage(err, "Failed to load website requests"),
          );
          setSites([]);
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

  const totalPages = Math.max(1, Math.ceil((total || sites.length) / LIMIT));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">
            Website Requests
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
          Loading requests…
        </p>
      ) : sites.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No pending website requests
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {sites.map((site) => (
            <WebsiteCard
              key={site._id}
              site={site}
              onOpen={() => setOpenId(site._id)}
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

      {openId && (
        <WebsiteDetailModal
          websiteId={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => setReloadIndex((i) => i + 1)}
          onToast={setToastMessage}
        />
      )}
    </div>
  );
}

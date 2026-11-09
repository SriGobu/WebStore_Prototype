import { useEffect, useState } from "react";
import {
  UserCog,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  X,
  Ban,
  CheckCircle2,
  ArrowDownCircle,
  Trash2,
  Mail,
  Clock,
  Globe,
  Star,
  Eye,
} from "lucide-react";
import {
  getAllUsers,
  getUserById,
  deleteUser,
  banUser,
  unbanUser,
  demoteToUser,
  getAllWebsites,
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
function extractUsers(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.users ?? d.data ?? [];
}
function extractUser(res) {
  const d = res?.data;
  if (!d) return null;
  return d.user ?? (Array.isArray(d) ? d[0] : d);
}
function extractWebsites(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.websites ?? d.data ?? [];
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

function DeveloperCard({ user, onOpen }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-xl border border-[#e8ddd2] overflow-hidden flex flex-col min-w-0 text-left hover:border-[#334155] transition-colors"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="size-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-semibold">{initial}</span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-[92px]">
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a] leading-snug truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-[#999] truncate mt-0.5">
              {user.email}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
              Developer
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                user.accountLocked
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {user.accountLocked ? "Banned" : "Active"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function WebsiteRow({ site }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="size-8 rounded-lg bg-[#f1f5f9] shrink-0 overflow-hidden flex items-center justify-center">
        {site.icon?.url ? (
          <img
            src={site.icon.url}
            alt={site.name}
            className="size-full object-cover"
          />
        ) : (
          <Globe size={14} className="text-[#334155]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#1a1a1a] truncate">
          {site.name}
        </p>
        <p className="text-[11px] text-[#999] truncate capitalize">
          {site.category}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#666]">
        <span className="flex items-center gap-1">
          <Eye size={12} className="text-[#999]" />
          {(site.uniqueVisitors ?? 0).toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          {site.averageRating > 0 ? Number(site.averageRating).toFixed(1) : "—"}
          {site.totalReviews > 0 && (
            <span className="text-[#bbb]">({site.totalReviews})</span>
          )}
        </span>
      </div>
    </div>
  );
}

function DeveloperDetailModal({ userId, onClose, onChanged, onToast }) {
  const [user, setUser] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "ban" | "unban" | "demote" | "delete" | null

  // Single fetch path for the detail record + this developer's websites,
  // keyed only on userId. Websites are filtered client-side from the full
  // list since there's no /admin/websites?ownerId= endpoint — same pattern
  // AdminBrowseWebsites already uses (fetch all, filter in the component).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [userRes, websitesRes] = await Promise.all([
          getUserById(userId),
          getAllWebsites({ limit: 1000 }),
        ]);
        if (cancelled) return;
        const loadedUser = extractUser(userRes);
        setUser(loadedUser);
        const allSites = extractWebsites(websitesRes);
        setWebsites(
          allSites.filter((w) => String(w.ownerId) === String(userId)),
        );
      } catch (err) {
        if (!cancelled)
          onToast(getErrorMessage(err, "Failed to load developer"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, onToast]);

  async function runAction(action) {
    setBusy(true);
    try {
      if (action === "ban") {
        await banUser(userId);
        onToast("Developer banned");
      } else if (action === "unban") {
        await unbanUser(userId);
        onToast("Developer unbanned");
      } else if (action === "demote") {
        await demoteToUser(userId);
        onToast("Developer demoted to user");
      } else if (action === "delete") {
        await deleteUser(userId);
        onToast("Developer deleted");
      }
      onChanged();
      onClose();
    } catch (err) {
      onToast(getErrorMessage(err, "Action failed"));
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  }

  const confirmCopy = {
    ban: {
      title: "Ban this developer?",
      message:
        "They will be immediately signed out and unable to log back in until unbanned.",
      confirmLabel: "Ban",
      tone: "danger",
    },
    unban: {
      title: "Unban this developer?",
      message: "This restores their ability to log in normally.",
      confirmLabel: "Unban",
      tone: "primary",
    },
    demote: {
      title: "Demote to user?",
      message:
        "This account loses developer access. Their existing websites remain on the platform.",
      confirmLabel: "Demote",
      tone: "primary",
    },
    delete: {
      title: "Delete this developer?",
      message: "This permanently removes the account. This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    },
  };

  const totalVisitors = websites.reduce(
    (sum, w) => sum + (w.uniqueVisitors ?? 0),
    0,
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
            <h2 className="font-semibold text-[#1a1a1a] text-base">
              Developer Details
            </h2>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <p className="text-sm text-[#bbb] text-center py-10">
                Loading developer…
              </p>
            ) : !user ? (
              <p className="text-sm text-red-500 text-center py-10">
                Developer not found
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* ── Left: developer details ── */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="size-11 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[#1a1a1a] break-words">
                          {user.name}
                        </p>
                        <p className="text-[12px] text-[#888] flex items-center gap-1 mt-0.5 min-w-0">
                          <Mail size={12} className="shrink-0" />
                          <span className="break-all">{user.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                        Developer
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          user.accountLocked
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {user.accountLocked ? "Banned" : "Active"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          user.emailVerified
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-3">
                      <Clock size={12} /> Account
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <DetailRow
                        label="Joined"
                        value={formatDateTime(user.createdAt)}
                      />
                      <DetailRow
                        label="Last Updated"
                        value={formatDateTime(user.updatedAt)}
                      />
                    </div>
                  </div>

                  {websites.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#e8ddd2] p-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-3">
                        <Globe size={12} /> Summary
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DetailRow label="Websites" value={websites.length} />
                        <DetailRow
                          label="Total Visitors"
                          value={totalVisitors.toLocaleString()}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right: websites ── */}
                <div className="bg-white rounded-xl border border-[#e8ddd2] p-4 md:sticky md:top-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#999] uppercase tracking-wide mb-2">
                    <Globe size={12} /> Websites ({websites.length})
                  </div>
                  {websites.length === 0 ? (
                    <p className="text-[12px] text-[#bbb] text-center py-4">
                      No websites listed yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#f0ebe4]">
                      {websites.map((site) => (
                        <WebsiteRow key={site._id} site={site} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!loading && user && (
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-4 bg-white border-t border-[#e8ddd2] shrink-0">
              <button
                onClick={() => setConfirmAction("delete")}
                disabled={busy}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
              >
                <Trash2 size={13} /> Delete
              </button>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setConfirmAction("demote")}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-[#334155] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                >
                  <ArrowDownCircle size={13} /> Demote
                </button>
                {user.accountLocked ? (
                  <button
                    onClick={() => setConfirmAction("unban")}
                    disabled={busy}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-white bg-[#334155] hover:bg-[#293548] rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                  >
                    <CheckCircle2 size={13} /> Unban
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmAction("ban")}
                    disabled={busy}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-40 transition-colors w-full sm:w-auto"
                  >
                    <Ban size={13} /> Ban
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          {...confirmCopy[confirmAction]}
          loading={busy}
          onConfirm={() => runAction(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}

export default function AdminDevelopers() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [developers, setDevelopers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [reloadIndex, setReloadIndex] = useState(0);
  const [openUserId, setOpenUserId] = useState(null);

  // Single fetch path — triggered only by [page, search, reloadIndex]
  // changing. role is fixed to "developer" for this tab.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await getAllUsers({
          page,
          limit: LIMIT,
          role: "developer",
          ...(search ? { search } : {}),
        });
        if (cancelled) return;
        setDevelopers(extractUsers(res));
        setTotal(res?.data?.total ?? res?.data?.meta?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setToastMessage(getErrorMessage(err, "Failed to load developers"));
          setDevelopers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, reloadIndex]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const totalPages = Math.max(
    1,
    Math.ceil((total || developers.length) / LIMIT),
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog size={16} className="text-[#334155]" />
          <h2 className="font-semibold text-[#1a1a1a] text-sm">
            Developer Management
          </h2>
        </div>
        <button
          onClick={() => setReloadIndex((i) => i + 1)}
          className="flex items-center gap-1 text-[12px] text-[#334155] hover:underline"
        >
          <RefreshCcw size={12} /> Refresh
        </button>
      </div>

      <form
        onSubmit={handleSearchSubmit}
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

      {loading ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          Loading developers…
        </p>
      ) : developers.length === 0 ? (
        <p className="text-sm text-[#bbb] text-center py-10">
          No developers found
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {developers.map((u) => (
            <DeveloperCard
              key={u._id}
              user={u}
              onOpen={() => setOpenUserId(u._id)}
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

      {openUserId && (
        <DeveloperDetailModal
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
          onChanged={() => setReloadIndex((i) => i + 1)}
          onToast={setToastMessage}
        />
      )}
    </div>
  );
}

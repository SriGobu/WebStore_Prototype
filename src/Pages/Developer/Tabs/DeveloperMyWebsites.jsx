import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Globe,
  Star,
  List,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import {
  getMyWebsites,
  getWebsiteById,
  createWebsite,
  updateIcon,
  updateScreenshot,
  updateWebsite,
  deleteWebsite,
  getWebsiteStats,
} from "../../../Services/Developer/websiteService";
import { getMyWebsiteReviews } from "../../../Services/Developer/reviewService";
import Toast from "../../../Components/Common/Toast";
import useAuthStore from "../../../Store/authStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Productivity",
  "Developer Tools",
  "Design",
  "Analytics",
  "Finance",
  "Education",
  "Entertainment",
  "Other",
];

const STATUS_FILTERS = ["All", "active", "pending", "rejected"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * @abstract Returns a new empty form object for creating a website.
 * @returns {Object} An object with empty fields for name, url, category, description, tags, and ownerName.
 */
function emptyForm() {
  return {
    name: "",
    url: "",
    category: CATEGORIES[0],
    description: "",
    tags: "",
    ownerName: "",
  };
}
/**
 * @abstract Parses a comma-separated string of tags into an array.
 * @param {string} tagsInput - The comma-separated string of tags.
 * @returns {string[]} An array of trimmed tags.
 */
function parseTags(tagsInput = "") {
  return tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
/**
 * @abstract Builds a payload object for creating a new website.
 * @param {Object} form - The form data for the new website.
 * @param {string} fallbackOwnerName - The fallback owner name if not provided.
 * @returns {Object} The payload object for creating the website.
 */
function buildCreatePayload(form, fallbackOwnerName) {
  return {
    name: form.name.trim(),
    url: form.url.trim(),
    category: form.category,
    description: form.description.trim(),
    tags: parseTags(form.tags),
    ownerName: form.ownerName.trim() || fallbackOwnerName,
  };
}

/**
 * @abstract Builds a payload object for updating an existing website.
 * @param {Object} form - The form data for the updated website.
 * @param {Object} existingWebsite - The existing website data.
 * @param {string} fallbackOwnerName - The fallback owner name if not provided.
 * @returns {Object} The payload object for updating the website.
 */
function buildChangedPayload(form, existingWebsite, fallbackOwnerName) {
  const changed = {};

  const nextName = form.name.trim();
  const nextUrl = form.url.trim();
  const nextCategory = form.category;
  const nextDescription = form.description.trim();
  const nextOwnerName =
    form.ownerName.trim() || existingWebsite?.ownerName || fallbackOwnerName;
  const nextTags = parseTags(form.tags);

  const prevName = existingWebsite?.name ?? "";
  const prevUrl = existingWebsite?.url ?? "";
  const prevCategory = existingWebsite?.category ?? "";
  const prevDescription = existingWebsite?.description ?? "";
  const prevOwnerName = existingWebsite?.ownerName ?? "";
  const prevTags = Array.isArray(existingWebsite?.tags)
    ? existingWebsite.tags
    : [];

  if (nextName !== prevName) changed.name = nextName;
  if (nextUrl.toLowerCase() !== String(prevUrl).toLowerCase()) {
    changed.url = nextUrl;
  }
  if (nextCategory !== prevCategory) changed.category = nextCategory;
  if (nextDescription !== prevDescription)
    changed.description = nextDescription;
  if (nextOwnerName !== prevOwnerName) changed.ownerName = nextOwnerName;
  if (JSON.stringify(nextTags) !== JSON.stringify(prevTags)) {
    changed.tags = nextTags;
  }

  return changed;
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
      className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize shrink-0 whitespace-nowrap ${map[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={
            i <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
      <span className="ml-1 text-[11px] text-[#888]">
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[#555] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeveloperMyWebsites() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("list");
  const [websites, setWebsites] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toastMessage, setToastMessage] = useState("");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(null); // null = create
  const [deleteId, setDeleteId] = useState(null);
  const [viewReviewsId, setViewReviewsId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reasonWebsite, setReasonWebsite] = useState(null); // website | null — for viewing rejection reason

  // Form
  const [form, setForm] = useState(emptyForm());
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [screenshotFiles, setScreenshotFiles] = useState([]); // new files to upload (bulk add)
  const [screenshotPreviews, setScreenshotPreviews] = useState([]); // previews of new files
  const [replacingIdx, setReplacingIdx] = useState(null); // which existing screenshot slot is being replaced
  // eslint-disable-next-line no-unused-vars
  const [replaceFile, setReplaceFile] = useState(null); // unused direct, kept for ref
  // replaceQueue: array indexed by existing screenshot position { file, preview } | null
  const [replaceQueue, setReplaceQueue] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const iconRef = useRef(null);
  const screenshotRef = useRef(null); // for adding new screenshots
  const replaceRef = useRef(null); // for replacing one existing screenshot

  // ── Fetch websites ─────────────────────────────────────────────────────────
  useEffect(() => {
    load();
  }, []);
  /**
   * Fetches the list of websites for the current user.
   * @returns {Promise<void>}
   */
  async function load() {
    setLoading(true);
    try {
      const res = await getMyWebsites();
      const sites = res.data?.websites ?? [];
      setWebsites(sites);

      // Fetch stats in parallel
      const entries = await Promise.allSettled(
        sites.map((w) =>
          getWebsiteStats(w._id).then((r) => [w._id, r.data?.stats ?? null]),
        ),
      );
      const map = {};
      entries.forEach((r) => {
        if (r.status === "fulfilled" && r.value[1])
          map[r.value[0]] = r.value[1];
      });
      setStatsMap(map);
    } catch (err) {
      setToastMessage(err.message || "Failed to load websites");
    } finally {
      setLoading(false);
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = websites.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Create / Edit modal ────────────────────────────────────────────────────
  /**
   * Opens the modal for creating a new website, resetting all form fields and file states.
   */
  function openCreate() {
    setForm(emptyForm());
    setEditingWebsite(null);
    setIconFile(null);
    setIconPreview(null);
    setScreenshotFiles([]);
    setScreenshotPreviews([]);
    setReplacingIdx(null);
    setReplaceFile(null);
    setReplaceQueue([]);
    setShowModal(true);
  }
  /**
   * Opens the modal for editing an existing website.
   * @param {Object} w - The website object to edit.
   */
  async function openEdit(w) {
    try {
      const res = await getWebsiteById(w._id);
      const fullWebsite = res.data?.website ?? w;

      setForm({
        name: fullWebsite.name ?? "",
        url: fullWebsite.url ?? "",
        category: fullWebsite.category ?? CATEGORIES[0],
        description: fullWebsite.description ?? "",
        tags: (fullWebsite.tags ?? []).join(", "),
        ownerName: fullWebsite.ownerName ?? "",
      });
      setIconPreview(fullWebsite.icon?.url ?? null);
      setIconFile(null);
      setScreenshotFiles([]);
      setScreenshotPreviews([]);
      setReplacingIdx(null);
      setReplaceFile(null);
      setReplaceQueue([]);
      setEditingWebsite(fullWebsite);
      setShowModal(true);
    } catch (err) {
      setToastMessage(err.message || "Failed to load website details");
    }
  }
  /**
   * Handles the icon file pick event.
   * @param {Object} e - The change event object.
   */
  function handleIconPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  }
  /**
   * Handles the screenshot file pick event.
   * @param {Object} e - The change event object.
   */
  function handleScreenshotPick(e) {
    const files = Array.from(e.target.files ?? []);
    setScreenshotFiles((prev) => [...prev, ...files]);
    setScreenshotPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  }
  /**
   * Handles the replacement file pick event.
   * @param {Object} e - The change event object.
   */
  function handleReplacePick(e) {
    const file = e.target.files?.[0];
    if (!file || replacingIdx === null) return;
    setReplaceFile(file);
    // update preview immediately
    const url = URL.createObjectURL(file);
    // store as [screenshotId, previewUrl, file] in replaceQueue
    setReplaceQueue((prev) => {
      const next = [...prev];
      next[replacingIdx] = { file, preview: url };
      return next;
    });
    setReplacingIdx(null);
    e.target.value = "";
  }
  /**
   * Removes a newly added screenshot from the list.
   * @param {number} idx - The index of the screenshot to remove.
   */
  function removeNewScreenshot(idx) {
    // only remove from newly added files (after existing screenshots)
    const existingCount = editingWebsite?.screenshots?.length ?? 0;
    const newIdx = idx - existingCount;
    if (newIdx >= 0) {
      setScreenshotFiles((prev) => prev.filter((_, i) => i !== newIdx));
      setScreenshotPreviews((prev) => prev.filter((_, i) => i !== idx));
    }
  }
  // ── Local Asset Structural Pre-flight Validation ───────────────────────────
  /**
   * Validates the sizes of local files before uploading.
   * @returns {string|null} The validation error message or null if valid.
   */
  function validateLocalFileSizes() {
    const MAX_ICON_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_SCREEN_SIZE = 2 * 1024 * 1024; // 2MB

    if (iconFile && iconFile.size > MAX_ICON_SIZE) {
      return "Icon file size too large. Icons must be under 2MB.";
    }

    for (let i = 0; i < screenshotFiles.length; i++) {
      if (screenshotFiles[i].size > MAX_SCREEN_SIZE) {
        return `New Screenshot #${i + 1} size too large. Must be under 2MB.`;
      }
    }

    // Check files waiting inside the individual replacement queue array positions
    for (let i = 0; i < replaceQueue.length; i++) {
      const item = replaceQueue[i];
      if (item?.file && item.file.size > MAX_SCREEN_SIZE) {
        return `Replacement Screenshot for slot #${i + 1} size too large. Must be under 2MB.`;
      }
    }

    return null;
  }

  // ── Unified Handle Save Sequence ───────────────────────────────────────────
  /**
   * Handles the save action for the website form.
   * @returns {Promise<void>}
   */
  async function handleSave() {
    if (!form.name.trim() || !form.url.trim()) {
      setToastMessage("Name and URL are required");
      return;
    }

    // 1. Run local client-side file size validations before sending over network
    const validationError = validateLocalFileSizes();
    if (validationError) {
      setToastMessage(validationError);
      return;
    }

    setSaving(true);
    let completedSteps = {
      textUpdated: false,
      iconUpdated: false,
      screensReplacedCount: 0,
    };

    try {
      // ════════════════ FLOW A: ATOMIC CREATION FLOW ════════════════
      if (!editingWebsite) {
        // Enforce required files for creation
        if (!iconFile)
          throw new Error("An icon file is required to create a website.");
        if (screenshotFiles.length === 0)
          throw new Error("At least one screenshot is required.");

        const payload = buildCreatePayload(form, user?.name);
        // Pass payload alongside our file assets directly into the updated FormData service
        const res = await createWebsite(payload, iconFile, screenshotFiles);
        const website = res.data?.website;

        if (!website?._id)
          throw new Error("Failed to instantiate database tracking reference.");

        setShowModal(false);
        setToastMessage("Website created and submitted for approval");
        await load();
        return;
      }

      // ════════════════ FLOW B: MODULAR UPDATE FLOW ════════════════
      const websiteId = editingWebsite._id;

      // Step 2.1: Extract only the modified values to save network processing
      const changedFields = buildChangedPayload(
        form,
        editingWebsite,
        user?.name,
      );

      if (Object.keys(changedFields).length > 0) {
        await updateWebsite(websiteId, changedFields);
        completedSteps.textUpdated = true;
      }

      // Step 2.2: Process Icon asset replacement if a new one was staged
      if (iconFile) {
        await updateIcon(websiteId, iconFile);
        completedSteps.iconUpdated = true;
      }

      // Step 2.3: Process individual existing screenshot swaps sequentially
      for (let i = 0; i < replaceQueue.length; i++) {
        const item = replaceQueue[i];
        if (item && item.file) {
          const targetScreenshotId = editingWebsite.screenshots[i]?._id;
          if (targetScreenshotId) {
            await updateScreenshot(websiteId, targetScreenshotId, item.file);
            completedSteps.screensReplacedCount++;
          }
        }
      }

      // Step 2.4: Process brand new screenshots if appended to the array list
      if (screenshotFiles.length > 0) {
        // If your backend lacks a specific bulk array add route,
        // we can dynamically loop them over the single screenshot router wrapper
        for (const file of screenshotFiles) {
          await updateScreenshot(websiteId, "new", file);
        }
      }

      // If everything passes successfully, close the active UI modal session safely
      setShowModal(false);
      setToastMessage("Website modifications saved successfully");
      await load();
    } catch (err) {
      setToastMessage(err.message || "Failed to save website changes.");

      // Determine error context to explain if partial mutations occurred before failure
      let contextMsg = err.message || "Failed to save website changes.";
      if (
        editingWebsite &&
        (completedSteps.textUpdated ||
          completedSteps.iconUpdated ||
          completedSteps.screensReplacedCount > 0)
      ) {
        contextMsg = `Partial save: Text updates or media saved successfully, but a subsequent file upload failed: ${err.message || "Check settings"}`;
      }

      setToastMessage(
        err.message === "timeout"
          ? "Upload timed out. Please try again with smaller images."
          : contextMsg,
      );

      // CRITICAL DESIGN LAYER: DO NOT call setShowModal(false) here.
      // By keeping the component state alive, the user can change whatever broke
      // (e.g. fix a validation error) and hit save again without losing any input data.
    } finally {
      setSaving(false);
    }
  }

  /**
   * Handles the deletion of a website.
   * @returns {Promise<void>}
   */
  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteWebsite(deleteId);
      setDeleteId(null);
      setToastMessage("Website deleted");
      await load();
    } catch (err) {
      setToastMessage(err.message || "Failed to delete website");
    } finally {
      setDeleting(false);
    }
  }

  // ── Reviews modal ──────────────────────────────────────────────────────────
  /**
   * Opens the reviews modal for a specific website.
   * @param {string} websiteId - The ID of the website for which to view reviews.
   * @returns {Promise<void>}
   */
  async function openReviews(websiteId) {
    setViewReviewsId(websiteId);
    setReviewsLoading(true);
    try {
      const res = await getMyWebsiteReviews(websiteId);
      setReviews(res.data?.reviews ?? []);
    } catch (err) {
      setToastMessage(err.message || "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }

  // ── Input class ────────────────────────────────────────────────────────────
  const inputCls =
    "w-full border border-[#e8ddd2] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#c4956a] bg-white transition-colors";

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-[#e8ddd2] p-1 w-fit">
        {[{ id: "list", label: "Websites", Icon: List }].map(
          ({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-[#c4956a] text-white"
                  : "text-[#888] hover:text-[#c4956a]"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ),
        )}
      </div>

      {/* ════════════════ LIST TAB ════════════════ */}
      {tab === "list" && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search websites…"
                className="border border-[#e8ddd2] rounded-lg px-3 py-2 text-sm bg-white w-48 outline-none focus:border-[#c4956a] transition-colors"
              />
              {/* Status filter pills */}
              <div className="flex gap-1">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors capitalize ${
                      statusFilter === s
                        ? "bg-[#c4956a] text-white"
                        : "bg-white border border-[#e8ddd2] text-[#888] hover:text-[#c4956a]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#c4956a] text-white rounded-lg text-sm font-medium hover:bg-[#b08560] transition-colors shrink-0"
            >
              <Plus size={15} /> Add Website
            </button>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#bbb] text-sm">
              No websites found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((w) => (
                <WebsiteCard
                  key={w._id}
                  website={w}
                  stats={statsMap[w._id]}
                  onEdit={() => openEdit(w)}
                  onDelete={() => setDeleteId(w._id)}
                  onViewReviews={() => openReviews(w._id)}
                  onReupload={() => openCreate()} // reupload = new create flow
                  onShowReason={() => setReasonWebsite(w)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════ CREATE / EDIT MODAL ════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e8ddd2]">
              <h2 className="font-semibold text-[#1a1a1a]">
                {editingWebsite ? "Edit Website" : "Add Website"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#bbb] hover:text-[#666]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Website Name *">
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="My Awesome Site"
                  />
                </Field>
                <Field label="URL *">
                  <input
                    className={inputCls}
                    value={form.url}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, url: e.target.value }))
                    }
                    placeholder="https://mysite.com"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <div className="relative">
                    <select
                      className={`${inputCls} appearance-none`}
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none"
                    />
                  </div>
                </Field>
                <Field label="Owner Name">
                  <input
                    className={inputCls}
                    value={form.ownerName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ownerName: e.target.value }))
                    }
                    placeholder={user?.name ?? "Developer name"}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Describe your website…"
                />
              </Field>

              <Field label="Tags (comma separated)">
                <input
                  className={inputCls}
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder="Tools, Productivity, AI"
                />
              </Field>

              {/* Icon upload */}
              <Field label="Icon">
                <div
                  className="border-2 border-dashed border-[#e8ddd2] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#c4956a] transition-colors"
                  onClick={() => iconRef.current?.click()}
                >
                  <div className="size-14 rounded-lg bg-[#f5efe6] shrink-0 overflow-hidden flex items-center justify-center">
                    {iconPreview ? (
                      <img
                        src={iconPreview}
                        alt="icon"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Globe size={22} className="text-[#c4956a]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333]">
                      {iconPreview ? "Change icon" : "Upload icon"}
                    </p>
                    <p className="text-[11px] text-[#999]">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                  <Upload size={16} className="text-[#bbb] ml-auto" />
                </div>
                <input
                  ref={iconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleIconPick}
                />
              </Field>

              {/* Screenshots */}
              <Field label="Screenshots">
                {/* Existing screenshots — click each to replace individually */}
                {editingWebsite?.screenshots?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] text-[#999] mb-2">
                      Existing — click a screenshot to replace it individually
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {editingWebsite.screenshots.map((s, i) => {
                        const replaced = replaceQueue[i];
                        return (
                          <div
                            key={s._id ?? i}
                            className="relative group size-16 rounded-lg overflow-hidden border-2 border-[#e8ddd2] cursor-pointer hover:border-[#c4956a] transition-colors"
                            onClick={() => {
                              setReplacingIdx(i);
                              replaceRef.current?.click();
                            }}
                          >
                            <img
                              src={replaced?.preview ?? s.url}
                              alt=""
                              className="size-full object-cover"
                            />
                            {/* Replace overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                              <Upload size={12} className="text-white" />
                              <span className="text-white text-[9px]">
                                Replace
                              </span>
                            </div>
                            {/* Replaced badge */}
                            {replaced && (
                              <div className="absolute top-0 right-0 bg-[#c4956a] text-white text-[8px] px-1 py-0.5 rounded-bl">
                                new
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hidden input for replacing one screenshot */}
                <input
                  ref={replaceRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReplacePick}
                />

                {/* Add new screenshots (bulk) */}
                <div
                  className="border-2 border-dashed border-[#e8ddd2] rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#c4956a] transition-colors min-h-[72px]"
                  onClick={() => screenshotRef.current?.click()}
                >
                  <Upload size={18} className="text-[#ccc]" />
                  <p className="text-[12px] text-[#999]">
                    {editingWebsite
                      ? "Add more screenshots"
                      : "Click to add screenshots"}
                  </p>
                </div>
                <input
                  ref={screenshotRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleScreenshotPick}
                />

                {/* New screenshot previews */}
                {screenshotPreviews.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {screenshotPreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative group size-16 rounded-lg overflow-hidden border border-[#e8ddd2]"
                      >
                        <img
                          src={src}
                          alt=""
                          className="size-full object-cover"
                        />
                        <button
                          onClick={() => removeNewScreenshot(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X size={14} className="text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-[#c4956a]/80 text-white text-[9px] text-center py-0.5">
                          new
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#e8ddd2]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[#666] border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-[#c4956a] text-white rounded-lg hover:bg-[#b08560] font-medium transition-colors disabled:opacity-40"
              >
                {saving
                  ? "Saving…"
                  : editingWebsite
                    ? "Save Changes"
                    : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ DELETE CONFIRM ════════════════ */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h2 className="font-semibold text-[#1a1a1a] mb-1">
              Delete Website?
            </h2>
            <p className="text-sm text-[#888] mb-5">
              This permanently deletes the website, all reviews, screenshots and
              data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2 text-sm border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-40 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ REVIEWS MODAL ════════════════ */}
      {viewReviewsId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#e8ddd2]">
              <h2 className="font-semibold text-[#1a1a1a]">
                Reviews — {websites.find((w) => w._id === viewReviewsId)?.name}
              </h2>
              <button
                onClick={() => setViewReviewsId(null)}
                className="text-[#bbb] hover:text-[#666]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <span className="inline-block w-5 h-5 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-center text-[#bbb] text-sm py-8">
                  No reviews yet.
                </p>
              ) : (
                reviews.map((r) => (
                  <div key={r._id} className="bg-[#faf7f3] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {r.userId?.name ?? "Anonymous"}
                      </span>
                      <StarRow rating={r.rating} />
                    </div>
                    {r.design && (
                      <p className="text-[12px] text-[#666] mb-1">{r.design}</p>
                    )}
                    {r.additionalComments && (
                      <p className="text-[12px] text-[#888]">
                        {r.additionalComments}
                      </p>
                    )}
                    <p className="text-[10px] text-[#bbb] mt-1">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ REJECTION REASON MODAL ════════════════ */}
      {reasonWebsite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <h2 className="font-semibold text-[#1a1a1a] text-sm">
                  Rejection Reason
                </h2>
              </div>
              <button
                onClick={() => setReasonWebsite(null)}
                className="text-[#bbb] hover:text-[#666] shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[12px] text-[#999] mb-1 truncate">
              {reasonWebsite.name}
            </p>
            <p className="text-[13px] text-[#333] leading-relaxed bg-red-50 border border-red-100 rounded-lg p-3 break-words">
              {reasonWebsite.approvalStatus?.rejectionReason ??
                "No reason provided."}
            </p>
            <button
              onClick={() => setReasonWebsite(null)}
              className="mt-4 w-full py-2 text-sm text-[#555] border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Website Card ─────────────────────────────────────────────────────────────

function WebsiteCard({
  website: w,
  stats,
  onEdit,
  onDelete,
  onViewReviews,
  onReupload,
  onShowReason,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e8ddd2] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-[#f5efe6] flex items-center justify-center shrink-0 overflow-hidden">
          {w.icon?.url ? (
            <img
              src={w.icon.url}
              alt="icon"
              className="size-full object-cover"
            />
          ) : (
            <Globe size={18} className="text-[#c4956a]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="font-semibold text-[#1a1a1a] text-sm truncate min-w-0 flex-1">
              {w.name}
            </p>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end max-w-[60%]">
              <StatusBadge status={w.status} />
              {w.status === "rejected" && w.approvalStatus?.rejectionReason && (
                <button
                  onClick={onShowReason}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
                >
                  <AlertTriangle size={10} /> Reason
                </button>
              )}
            </div>
          </div>
          <a
            href={w.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#c4956a] hover:underline flex items-center gap-0.5 truncate"
          >
            {w.url} <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Description */}
      {w.description && (
        <p className="text-[12px] text-[#666] line-clamp-2">{w.description}</p>
      )}

      {/* Tags */}
      {w.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {w.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] bg-[#f5efe6] text-[#c4956a] px-2 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
          {w.tags.length > 3 && (
            <span className="text-[10px] text-[#bbb]">
              +{w.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Rating */}
      <div className="text-[12px] text-[#888]">
        {(w.averageRating ?? 0) > 0 ? (
          <StarRow rating={w.averageRating} />
        ) : (
          <span className="text-[#ccc]">Not yet rated</span>
        )}
      </div>

      {/* Screenshots */}
      {w.screenshots?.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {w.screenshots.slice(0, 4).map((s, i) => (
            <div
              key={s._id ?? i}
              className="size-12 rounded-md bg-[#f5efe6] shrink-0 overflow-hidden"
            >
              <img src={s.url} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {(stats?.totalVisitors > 0 || w.totalReviews > 0) && (
        <div className="flex items-center justify-between pt-1 border-t border-[#f0ebe4] text-[12px] text-[#888]">
          {stats?.totalVisitors > 0 && (
            <span>{stats.totalVisitors.toLocaleString()} visitors</span>
          )}
          {w.totalReviews > 0 && (
            <button
              onClick={onViewReviews}
              className="text-[11px] text-[#c4956a] hover:underline"
            >
              {w.totalReviews} review{w.totalReviews !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#f0ebe4]">
        {w.status === "pending" ? (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-amber-600 bg-amber-50 rounded-lg">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            Awaiting approval — editing locked
          </div>
        ) : w.status === "rejected" ? (
          <>
            <button
              onClick={onReupload}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-white bg-[#c4956a] rounded-lg hover:bg-[#b08560] transition-colors"
            >
              <Upload size={12} /> Reupload
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-[#555] border border-[#e8ddd2] rounded-lg hover:border-[#c4956a] hover:text-[#c4956a] transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

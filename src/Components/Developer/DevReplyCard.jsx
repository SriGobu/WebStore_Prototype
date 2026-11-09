import { useState } from "react";
import {
  createReply,
  updateReply,
  deleteReply,
} from "../../Services/Developer/reviewService";
import Toast from "../Common/Toast";

// ─── Individual reply item ────────────────────────────────────────────────────

function ReplyItem({ reply, currentUser, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState(reply.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = currentUser?._id ?? currentUser?.id;
  const isOwner = String(currentUserId) === String(reply.userId?._id);
  const isDev = reply.userId?.role === "developer";

  async function handleSave() {
    if (!editComment.trim()) return;
    setSaving(true);
    try {
      await onEdit(reply._id, editComment.trim());
      setIsEditing(false);
    } catch {
      // stay in edit mode
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(reply._id);
      setShowDelete(false);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-full size-6 flex items-center justify-center shrink-0 bg-[#c4956a]">
            <span className="font-semibold text-white text-[11px]">
              {(reply.userId?.name ?? "Deleted User").charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="font-semibold text-[#111] text-[13px]">
            {reply.userId?.name ?? "Deleted User"}
          </p>

          {isDev && (
            <span className="bg-[#c4956a] text-white text-[9px] font-bold px-1 py-1 rounded leading-none tracking-wide">
              DEV
            </span>
          )}

          {reply.createdAt && (
            <p className="font-light text-[#767676] text-[11px]">
              {new Date(reply.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Edit / Delete — only for the reply owner */}
        {isOwner && !isEditing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-[#999] hover:text-[#c4956a] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            rows={2}
            className="w-full bg-white border border-[#e0d9d0] rounded-lg px-3 py-2 text-[13px] text-[#111] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditComment(reply.comment ?? "");
              }}
              className="px-3 py-1 text-[12px] bg-white border border-[#e0d9d0] rounded-lg text-[#555] hover:bg-[#f5efe6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editComment.trim()}
              className="px-3 py-1 text-[12px] bg-[#c4956a] text-white rounded-lg hover:bg-[#b08560] disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="font-light text-[#333] text-[13px]">{reply.comment}</p>
      )}

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-[#111] text-base mb-2">
              Delete Reply?
            </h3>
            <p className="text-[#767676] text-sm mb-6">
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="flex-1 py-2 bg-[#f5efe6] border border-[#e0d9d0] rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 bg-red-500 rounded-xl text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DevReplyCard ─────────────────────────────────────────────────────────────

/**
 * Props:
 * - reviewId        — the review this reply belongs to
 * - replies         — array of reply objects
 * - currentUser     — logged-in developer from authStore
 * - isWebsiteOwner  — true only if this website was created by the logged-in developer
 * - onRepliesChange — callback to refresh replies in parent after any mutation
 */
export default function DevReplyCard({
  reviewId,
  replies = [],
  currentUser,
  isWebsiteOwner = false,
  onRepliesChange,
}) {
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const currentUserId = currentUser?._id ?? currentUser?.id;

  // Developer already replied to this review
  const alreadyReplied = replies.some(
    (r) => String(r.userId?._id) === String(currentUserId),
  );

  // Can only reply if:
  // 1. This website belongs to the logged-in developer
  // 2. They haven't already replied to this review
  const canReply = isWebsiteOwner && !alreadyReplied;

  async function handleSubmit() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await createReply(reviewId, { comment: comment.trim() });
      setComment("");
      setShowForm(false);
      onRepliesChange?.();
    } catch (err) {
      setToastMessage(err.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(replyId, newComment) {
    try {
      await updateReply(replyId, { comment: newComment });
      onRepliesChange?.();
    } catch (err) {
      setToastMessage(err.message || "Failed to update reply");
      throw err;
    }
  }

  async function handleDelete(replyId) {
    try {
      await deleteReply(replyId);
      onRepliesChange?.();
    } catch (err) {
      setToastMessage(err.message || "Failed to delete reply");
      throw err;
    }
  }

  return (
    <div className="ml-12 mt-3 space-y-3">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* Existing replies */}
      {replies.map((reply) => (
        <ReplyItem
          key={reply._id}
          reply={reply}
          currentUser={currentUser}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}

      {/* Reply form — only if website owner and hasn't replied yet */}
      {canReply &&
        (showForm ? (
          <div className="space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your reply as the developer..."
              rows={3}
              autoFocus
              className="w-full bg-white border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-[13px] text-[#111] placeholder:text-[#b0a898] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setComment("");
                }}
                className="px-4 py-1.5 text-[12px] bg-[#f5efe6] border border-[#e0d9d0] rounded-lg text-[#555] hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !comment.trim()}
                className="px-4 py-1.5 text-[12px] bg-[#c4956a] text-white rounded-lg hover:bg-[#b08560] disabled:opacity-40 transition-colors"
              >
                {submitting ? "Posting…" : "Post Reply"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="text-[12px] text-[#c4956a] hover:underline transition-colors"
          >
            + Reply as Developer
          </button>
        ))}
    </div>
  );
}

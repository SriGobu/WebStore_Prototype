import { useState } from "react";
import ReplyCard from "./ReplyCard";
import ThreeDotMenu from "./ThreeDotMenu";
import ReportModal from "../Common/ReportModal";
import { reportReview, voteReview } from "../../Services/Common/reportService";
import Toast from "../Common/Toast";

export default function ReviewCard({
  review,
  currentUser,
  onEdit,
  onDelete,
  replies,
  QUESTIONS,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    rating: review.rating,
    design: review.design,
    functionality: review.functionality,
    performance: review.performance,
    designSkipped: false,
    functionalitySkipped: false,
    performanceSkipped: false,
    additionalComments: review.additionalComments,
  });
  const [showReport, setShowReport] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // ─── Vote state ───────────────────────────────────────────────────────────
  const currentUserId = currentUser?._id ?? currentUser?.id;

  const [votes, setVotes] = useState({
    up: review.voteUp ?? 0,
    down: review.voteDown ?? 0,
  });

  // Derive initial userVote from the voter arrays on the review object
  const [userVote, setUserVote] = useState(() => {
    if (review.voteUpUsers?.some((id) => String(id) === String(currentUserId)))
      return "up";
    if (
      review.voteDownUsers?.some((id) => String(id) === String(currentUserId))
    )
      return "down";
    return null;
  });

  const [voteLoading, setVoteLoading] = useState(false);

  async function handleVote(type) {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const res = await voteReview(review._id, type);
      const { voteUp, voteDown } = res.data;
      setVotes({ up: voteUp, down: voteDown });
      // Toggle off if clicking the same vote again
      setUserVote((prev) => (prev === type ? null : type));
    } catch (err) {
      setToastMessage(err.message || "Failed to register vote");
    } finally {
      setVoteLoading(false);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const isOwner = String(currentUserId) === String(review.userId?._id);

  async function handleReport(payload) {
    setReporting(true);
    try {
      await reportReview(review._id, payload);
      setAlreadyReported(true);
      setShowReport(false);
      setToastMessage("Review reported successfully.");
    } catch (err) {
      setToastMessage(err.toastMessage || "Failed to report review.");
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="border-b border-[#e0d9d0] pb-6 last:border-0">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="rounded-full size-9 flex items-center justify-center shrink-0 bg-[#c4956a]">
          <span className="font-semibold text-white text-[13px]">
            {(review.userId?.name ?? "Deleted User").charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-[#111] text-[15px]">
              {review.userId?.name ?? "Deleted User"}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < review.rating ? "text-[#c4956a]" : "text-[#e0d9d0]"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              {!isEditing && (
                <ThreeDotMenu
                  isOwn={isOwner}
                  onEdit={isOwner ? () => setIsEditing(true) : undefined}
                  onDelete={
                    isOwner ? () => setShowDeleteConfirm(true) : undefined
                  }
                  onReport={!isOwner ? () => setShowReport(true) : undefined}
                  alreadyReported={alreadyReported}
                />
              )}
            </div>
          </div>
          <p className="font-light text-[#767676] text-[13px]">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing ? (
        <div className="ml-12 space-y-4">
          {/* Star Rating */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setEditForm((f) => ({ ...f, rating: star }))}
                className="text-2xl transition-colors"
                style={{
                  color: star <= editForm.rating ? "#c4956a" : "#e0d9d0",
                }}
              >
                ★
              </button>
            ))}
          </div>

          {/* 3 Questions */}
          {QUESTIONS.map(({ key, label }) => {
            const skippedKey = `${key}Skipped`;
            const isSkipped = editForm[skippedKey];
            return (
              <div key={key}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[13px] text-[#333] font-medium">{label}</p>
                  <button
                    onClick={() =>
                      setEditForm((f) => ({
                        ...f,
                        [skippedKey]: !isSkipped,
                        [key]: isSkipped ? f[key] : "",
                      }))
                    }
                    className={`shrink-0 text-[13px] px-2 py-0.5 rounded-lg border transition-colors ${
                      isSkipped
                        ? "bg-[#c4956a] text-white border-[#c4956a]"
                        : "bg-[#f5efe6] text-[#767676] border-[#e0d9d0]"
                    }`}
                  >
                    {isSkipped ? "Undo Skip" : "Skip"}
                  </button>
                </div>
                {isSkipped ? (
                  <div className="bg-[#f5efe6] border border-dashed border-[#c4956a] rounded-xl px-4 py-2">
                    <p className="text-[13px] text-[#b0a898] italic">
                      Question skipped
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    rows={2}
                    className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-3 py-2 text-[13px] text-[#111] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
                  />
                )}
              </div>
            );
          })}

          {/* Additional Comments */}
          <div>
            <p className="text-xs text-[#333] font-medium mb-1">
              Additional comments (optional)
            </p>
            <textarea
              value={editForm.additionalComments}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  additionalComments: e.target.value,
                }))
              }
              rows={2}
              className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-3 py-2 text-sm text-[#111] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
            />
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  await onEdit(editForm);
                  setIsEditing(false);
                } catch {
                  // stay in edit mode on error
                }
              }}
              className="flex-1 bg-[#c4956a] py-2 rounded-xl font-semibold text-white text-sm hover:bg-[#b08560] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* Read mode */
        <div className="space-y-3 ml-12">
          {QUESTIONS.map(
            ({ key, label }) =>
              review[key] && (
                <div key={key}>
                  <p className="text-[13px] text-[#c4956a] font-semibold mb-0.5">
                    {label}
                  </p>
                  <p className="font-light text-[#333] text-[13px]">
                    {review[key]}
                  </p>
                </div>
              ),
          )}

          {review.additionalComments && (
            <div className="mt-3 pt-3 border-t border-[#e0d9d0]">
              <p className="text-[13px] text-[#767676] font-semibold mb-0.5">
                Additional comments
              </p>
              <p className="font-light text-[#333] text-[13px]">
                {review.additionalComments}
              </p>
            </div>
          )}

          {/* ── Vote row ── */}
          <div className="flex items-center gap-3 pt-3">
            <span className="text-[12px] text-[#767676]">Helpful?</span>

            {/* Upvote */}
            <button
              onClick={() => handleVote("up")}
              disabled={voteLoading || isOwner}
              title={isOwner ? "You can't vote on your own review" : "Helpful"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
                userVote === "up"
                  ? "bg-[#c4956a] border-[#c4956a] text-white"
                  : "bg-[#f5efe6] border-[#e0d9d0] text-[#555] hover:border-[#c4956a] hover:text-[#c4956a]"
              }`}
            >
              ▲ {votes.up}
            </button>

            {/* Downvote */}
            <button
              onClick={() => handleVote("down")}
              disabled={voteLoading || isOwner}
              title={
                isOwner ? "You can't vote on your own review" : "Not helpful"
              }
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
                userVote === "down"
                  ? "bg-[#767676] border-[#767676] text-white"
                  : "bg-[#f5efe6] border-[#e0d9d0] text-[#555] hover:border-[#767676] hover:text-[#767676]"
              }`}
            >
              ▼ {votes.down}
            </button>
          </div>
        </div>
      )}

      {/* Reply section */}
      {<ReplyCard replies={replies} />}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-[#111] text-base mb-2">
              Delete Review?
            </h3>
            <p className="font-light text-[#767676] text-sm mb-6">
              This action cannot be undone. Your review will be permanently
              deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 bg-red-500 py-2 rounded-xl font-semibold text-white text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          targetType="review"
          onSubmit={handleReport}
          onClose={() => setShowReport(false)}
          submitting={reporting}
        />
      )}
    </div>
  );
}

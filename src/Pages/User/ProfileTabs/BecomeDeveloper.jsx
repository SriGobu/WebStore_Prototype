import { useState, useEffect } from "react";
import {
  getPromotionStatus,
  requestPromotion,
  deletePromotionRequest,
} from "../../../Services/User/promotionService";

export default function BecomeDeveloper({ onToast }) {
  const [status, setStatus] = useState(null); // null | { _id, status: 'pending'|'approved'|'rejected', reason, rejectionReason }
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await getPromotionStatus();
        setStatus(res.data.promotionRequest ?? null);
      } catch (err) {
        if (err.status !== 404) {
          onToast(err.message || "Failed to load promotion status");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [onToast]);

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await requestPromotion(reason.trim());
      const res = await getPromotionStatus();
      setStatus(res.data.promotionRequest ?? null);
      setReason("");
      onToast("Application submitted successfully");
    } catch (err) {
      onToast(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePromotionRequest(status._id);
      setStatus(null);
      onToast("Application withdrawn");
      setShowDeleteConfirm(false);
    } catch (err) {
      onToast(err.message || "Failed to withdraw application");
    } finally {
      setDeleting(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  // Already a developer
  if (status?.status === "approved")
    return (
      <div className="bg-[#fafafa] rounded-xl shadow-md p-8 text-center">
        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="font-semibold text-[#111] text-xl mb-2">
          You're a Developer!
        </h2>
        <p className="font-light text-[#767676] text-sm">
          Your developer application has been approved. You now have access to
          developer features.
        </p>
      </div>
    );

  // Pending
  if (status?.status === "pending")
    return (
      <div className="bg-[#fafafa] rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <div className="size-16 bg-[#f5efe6] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="font-semibold text-[#111] text-xl mb-2">
            Application Under Review
          </h2>
          <p className="font-light text-[#767676] text-sm">
            Your application has been submitted and is being reviewed by our
            team. This typically takes 3–5 business days.
          </p>
        </div>

        <div className="bg-[#f5efe6] rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#767676] mb-1">
            Your reason
          </p>
          <p className="text-sm text-[#333] font-light">{status.reason}</p>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full bg-[#f5efe6] border border-[#e0d9d0] text-red-500 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors"
        >
          Withdraw Application
        </button>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-semibold text-[#111] text-base mb-2">
                Withdraw Application?
              </h3>
              <p className="font-light text-[#767676] text-sm mb-6">
                Your application will be cancelled. You can reapply at any time.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-500 py-2 rounded-xl font-semibold text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-40"
                >
                  {deleting ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

  // Rejected — allow reapply
  if (status?.status === "rejected")
    return (
      <div className="space-y-6">
        <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-lg">✕</span>
            </div>
            <div>
              <h2 className="font-semibold text-[#111] text-base">
                Application Rejected
              </h2>
              <p className="font-light text-[#767676] text-xs">
                You can reapply with an updated reason
              </p>
            </div>
          </div>
          {status.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-600 mb-1">
                Rejection reason
              </p>
              <p className="text-sm text-[#333] font-light">
                {status.rejectionReason}
              </p>
            </div>
          )}
        </div>
        <ApplyForm
          reason={reason}
          setReason={setReason}
          onSubmit={handleSubmit}
          submitting={submitting}
          isReapply
        />
      </div>
    );

  // No request yet
  return (
    <ApplyForm
      reason={reason}
      setReason={setReason}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );
}

function ApplyForm({ reason, setReason, onSubmit, submitting, isReapply }) {
  return (
    <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
      <h2 className="font-semibold text-[#111] text-xl mb-2">
        {isReapply ? "Reapply as Developer" : "Become a Developer"}
      </h2>
      <p className="font-light text-[#767676] text-sm mb-6">
        Apply to publish your apps on WebStore. Share your tools with users
        worldwide.
      </p>
      <div className="space-y-4">
        <div>
          <label className="font-medium text-[#333] text-sm mb-1.5 block">
            Why do you want to become a developer?{" "}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Share your motivation and experience..."
            rows={6}
            className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#b0a898] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={submitting || !reason.trim()}
          className="w-full bg-[#c4956a] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

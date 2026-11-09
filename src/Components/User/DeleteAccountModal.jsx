import { useState } from "react";
import DataHandlingContent from "../../Constants/DataHandlingContent";
/**
 * DeleteAccountModal
 *
 * Self-contained delete-account confirmation flow:
 * - Shows a short delete warning
 * - Displays the shared "How We Handle Your Data" explanation (same
 *   content as the Privacy Policy, kept in sync via one shared source)
 * - Offers a toggle for whether reviews/replies are anonymized
 *   (default) or permanently deleted along with everything else
 * - Calls onConfirm(deleteContentToo) when the user confirms
 *
 * Props:
 * - onCancel: () => void
 * - onConfirm: (deleteContentToo: boolean) => Promise<void> | void
 * - deleting: boolean — disables buttons while the delete request is
 *   in flight (owned by the parent, since the parent makes the API call)
 */
export default function DeleteAccountModal({ onCancel, onConfirm, deleting }) {
  const [deleteContentToo, setDeleteContentToo] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 overflow-y-auto">
      <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-md p-6 my-auto">
        <h3 className="font-semibold text-[#111] text-lg mb-2">
          Delete Account?
        </h3>
        <p className="font-light text-[#767676] text-sm mb-5">
          This will permanently delete your account. This action cannot be
          undone.
        </p>

        {/* Shared data handling explainer — same content as Privacy Policy */}
        <div className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-[#111] mb-3">
            {DataHandlingContent.heading}
          </p>
          <div className="space-y-3">
            {DataHandlingContent.sections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-[#333] mb-1">
                  {section.title}
                </p>
                <p className="font-light text-[#333] text-xs leading-relaxed">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <input
            type="checkbox"
            checked={deleteContentToo}
            onChange={(e) => setDeleteContentToo(e.target.checked)}
            className="mt-0.5 size-4 accent-[#c4956a] cursor-pointer shrink-0"
          />
          <span className="text-sm text-[#333]">
            <span className="font-medium">
              Also permanently delete my reviews and replies
            </span>
            <br />
            <span className="font-light text-[#767676] text-xs">
              This is final — even a new account with the same email won't be
              able to recover this content.
            </span>
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(deleteContentToo)}
            disabled={deleting}
            className="flex-1 bg-red-500 py-2 rounded-xl font-semibold text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

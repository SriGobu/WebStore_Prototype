import { useState } from "react";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or self-promotion" },
  {
    value: "inappropriate content",
    label: "Inappropriate or offensive content",
  },
  { value: "fake", label: "Fake or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "off-topic", label: "Not relevant to this website" },
];

/**
 * ReportModal — shared between user and developer portals.
 *
 * Props:
 * - targetType  : "review" | "website"
 * - targetName  : display name shown in the header (e.g. website name or reviewer name)
 * - onSubmit    : async ({ reason, additionalText }) => void
 *                 caller handles the actual API call (user vs dev endpoint)
 * - onClose     : () => void
 * - submitting  : boolean — controlled by parent
 */
export default function ReportModal({
  targetType,
  targetName,
  onSubmit,
  onClose,
  submitting,
}) {
  const [reason, setReason] = useState("");
  const [additionalText, setAdditionalText] = useState("");

  async function handleSubmit() {
    if (!reason || submitting) return;
    await onSubmit({ reason, additionalText: additionalText.trim() });
  }

  const label = targetType === "review" ? "Review" : "Website";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[#111] text-base">
            Report {label}
          </h3>
          <button
            onClick={onClose}
            className="text-[#767676] hover:text-[#111] text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {targetName && (
          <p className="text-[11px] text-[#999] mb-4 truncate">{targetName}</p>
        )}

        <p className="font-light text-[#767676] text-xs mb-4">
          Help us understand what's wrong with this {label.toLowerCase()}.
        </p>

        {/* Reasons */}
        <div className="space-y-2 mb-4">
          {REPORT_REASONS.map(({ value, label: optLabel }) => (
            <label
              key={value}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                reason === value
                  ? "bg-[#f5efe6] border-[#c4956a]"
                  : "bg-white border-[#e0d9d0] hover:border-[#c4956a]"
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className="accent-[#c4956a] shrink-0"
              />
              <span className="text-sm text-[#333]">{optLabel}</span>
            </label>
          ))}
        </div>

        {/* Additional details */}
        <div className="mb-5">
          <label className="font-medium text-[#333] text-sm mb-1.5 block">
            Additional details{" "}
            <span className="font-light text-[#767676]">(optional)</span>
          </label>
          <textarea
            value={additionalText}
            onChange={(e) => setAdditionalText(e.target.value)}
            placeholder="Add any additional context..."
            rows={3}
            className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-[#b0a898] resize-none focus:outline-none focus:border-[#c4956a] transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-[#f5efe6] border border-[#e0d9d0] py-2 rounded-xl text-[#111] text-sm hover:bg-[#e8dfd4] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="flex-1 bg-[#c4956a] py-2 rounded-xl font-semibold text-white text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Reporting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

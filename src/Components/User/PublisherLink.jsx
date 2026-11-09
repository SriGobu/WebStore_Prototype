import { useNavigate } from "react-router-dom";

/**
 * DeveloperLink
 *
 * Renders the website's owner/developer name as a clickable link
 * (Play Store style) that navigates to a page listing all websites
 * by that same developer.
 *
 * Props:
 * - ownerName: string
 * - fallback: string shown if ownerName is missing (e.g. category)
 * - className: optional extra classes
 */
export default function PublisherLink({ ownerName, fallback, className }) {
  const navigate = useNavigate();

  if (!ownerName) {
    return (
      <p className={className ?? "text-[#767676] text-sm mb-4"}>{fallback}</p>
    );
  }

  return (
    <button
      onClick={() => navigate(`/developer/${encodeURIComponent(ownerName)}`)}
      className={
        className ??
        "text-[#767676] text-sm mb-4 hover:text-[#c4956a] hover:underline transition-colors text-left"
      }
    >
      {ownerName}
    </button>
  );
}

/**
 * DevPublisherLink
 *
 * Developer portal version of PublisherLink.
 * Instead of navigate() to a user route, calls onNavigate prop
 * so navigation stays inside the portal shell.
 *
 * Props:
 * - ownerName: string
 * - fallback: string shown if ownerName is missing
 * - onNavigate: (ownerName) => void — handled by parent
 * - className: optional extra classes
 */
export default function DevPublisherLink({
  ownerName,
  fallback,
  onNavigate,
  className,
}) {
  if (!ownerName) {
    return (
      <p className={className ?? "text-[#767676] text-sm mb-4"}>{fallback}</p>
    );
  }

  return (
    <button
      onClick={() => onNavigate?.(ownerName)}
      className={
        className ??
        "text-[#767676] text-sm mb-4 hover:text-[#c4956a] hover:underline transition-colors text-left"
      }
    >
      {ownerName}
    </button>
  );
}

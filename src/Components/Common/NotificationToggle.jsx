export default function NotificationToggle({ label, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-[#333]">{label}</span>
      <button
        onClick={() => {
          onChange();
        }}
        aria-label={label}
        className={`w-10 h-6 rounded-full transition-colors ${
          enabled ? "bg-[#c4956a]" : "bg-[#e0d9d0]"
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

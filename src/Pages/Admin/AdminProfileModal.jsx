import { useState } from "react";
import { X, LayoutDashboard, Settings } from "lucide-react";
import AdminAccountOverview from "./ProfileTabs/AdminAccountOverview";
import NotificationSettings from "../../Components/Admin/NotificationSettings";
import Toast from "../../Components/Common/Toast";

// Kept as "account"/"settings" (not "overview"/etc.) to match the ids
// AdminDashboard.jsx already passes in via PROFILE_MENU + openProfile(id) —
// changing these would silently break that wiring.
const TABS = [
  { id: "account", label: "Account Overview", icon: LayoutDashboard },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminProfileModal({
  defaultTab = "account",
  onClose,
  onToast,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [toastMessage, setToastMessage] = useState("");

  // Falls back to the parent's onToast if provided (AdminDashboard.jsx passes
  // one in), otherwise shows the toast locally within the modal — mirrors
  // the same optional-callback pattern DevProfileModal uses.
  function handleToast(msg) {
    if (onToast) onToast(msg);
    else setToastMessage(msg);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-2xl h-full max-h-[90vh] md:max-h-[80vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e8ddd2] shrink-0">
          <h2 className="font-semibold text-[#1a1a1a] text-base">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body: sidebar + content (same responsive pattern as DevProfileModal) ── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <aside className="w-full md:w-48 shrink-0 bg-white border-b md:border-b-0 md:border-r border-[#e8ddd2] flex md:flex-col py-1 md:py-3 justify-around md:justify-start">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-4 py-2 md:py-2.5 text-[11px] md:text-[13px] transition-all flex-1 md:flex-initial ${
                  activeTab === id
                    ? "bg-[#f5efe6] text-[#334155] font-medium border-b-2 md:border-b-0 md:border-r-2 border-[#334155]"
                    : "text-[#555] hover:bg-[#faf7f3] hover:text-[#334155]"
                }`}
              >
                <Icon size={18} className="shrink-0 md:size-[15px]" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </aside>

          <main className="flex-1 overflow-y-auto p-5">
            <Toast message={toastMessage} onClose={() => setToastMessage("")} />
            {activeTab === "account" && <AdminAccountOverview />}
            {activeTab === "settings" && (
              <div>
                {/* If/when a general AdminSettings component exists (mirroring
                    DevSettings), it belongs here above NotificationSettings —
                    not built yet since I haven't seen one referenced. */}
                <NotificationSettings onToast={handleToast} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Activity,
  Settings,
  Shield,
  Bell,
} from "lucide-react";
import DevAccountOverview from "./ProfileTabs/DevAccountOverview";
import DevActivity from "./ProfileTabs/DevActivity";
import DevSettings from "./ProfileTabs/DevSettings";
import DevLegal from "./ProfileTabs/DevLegal";
import Toast from "../../Components/Common/Toast";
import NotificationSettings from "../../Components/Developer/NotificationSettings";

const TABS = [
  { id: "overview", label: "Account Overview", icon: LayoutDashboard },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "legal", label: "Privacy & Terms", icon: Shield },
];

export default function DevProfileModal({
  defaultTab = "overview",
  onClose,
  onViewWebsite,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("profile") || defaultTab;
  const [toastMessage, setToastMessage] = useState("");

  function onToast(msg) {
    setToastMessage(msg);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="bg-[#f5efe6] rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] md:max-h-[80vh] flex flex-col overflow-hidden">
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

        {/* ── Body: sidebar + content ── */}
        {/* Changed flex to flex-col (mobile) and md:flex-row (desktop) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar / Navigation Bar */}
          {/* Changed width, layout, and borders to adjust on mobile vs desktop */}
          <aside className="w-full md:w-48 shrink-0 bg-white border-b md:border-b-0 md:border-r border-[#e8ddd2] flex md:flex-col py-1 md:py-3 justify-around md:justify-start">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() =>
                  setSearchParams((prev) => {
                    const params = new URLSearchParams(prev);
                    params.set("profile", id);
                    return params;
                  })
                }
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-4 py-2 md:py-2.5 text-[11px] md:text-[13px] transition-all flex-1 md:flex-initial ${
                  activeTab === id
                    ? "bg-[#f5efe6] text-[#c4956a] font-medium border-b-2 md:border-b-0 md:border-r-2 border-[#c4956a]"
                    : "text-[#555] hover:bg-[#faf7f3] hover:text-[#c4956a]"
                }`}
              >
                <Icon size={18} className="shrink-0 md:size-[15px]" />
                {/* Text hidden on mobile, displayed on medium screens and up */}
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </aside>

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-5">
            <Toast message={toastMessage} onClose={() => setToastMessage("")} />
            {activeTab === "overview" && (
              <DevAccountOverview onToast={onToast} />
            )}
            {activeTab === "activity" && (
              <DevActivity onToast={onToast} onViewWebsite={onViewWebsite} />
            )}
            {activeTab === "settings" && <DevSettings onToast={onToast} />}
            {activeTab === "notifications" && (
              <NotificationSettings onToast={onToast} />
            )}
            {activeTab === "legal" && <DevLegal />}
          </main>
        </div>
      </div>
    </div>
  );
}

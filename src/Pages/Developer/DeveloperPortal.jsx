import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  LayoutDashboard,
  Search,
  ClipboardList,
  Mail,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import useAuthStore from "../../Store/authStore";
import { logout } from "../../Utils/logout";
import ROUTES from "../../Constants/routeConstants";
import DeveloperDashboard from "./Tabs/DeveloperDashboard";
import DeveloperMyWebsites from "./Tabs/DeveloperMyWebsites";
import DeveloperBrowseWebsites from "./Tabs/DeveloperBrowseWebsites";
import DeveloperAudit from "./Tabs/DeveloperAudit";
import DeveloperSupport from "./Tabs/DeveloperSupport";
import DevProfileModal from "./DevProfileModal";
import NotificationBell from "../../Components/Common/NotificationBell";
// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "my-websites", label: "My Websites", icon: Globe },
  { id: "browse", label: "Browse Websites", icon: Search },
  { id: "audit", label: "Audit & Log", icon: ClipboardList },
  { id: "support", label: "Contact", icon: Mail },
];

const PAGE_TITLES = {
  dashboard: "Dashboard",
  "my-websites": "My Websites",
  browse: "Browse Websites",
  audit: "Audit & Log",
  support: "Contact",
};

// ─── Profile menu items (shown above the user card) ──────────────────────────

const PROFILE_MENU = [
  { id: "overview", label: "Account Overview" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
  { id: "notifications", label: "Notifications" },
  { id: "legal", label: "Privacy & Terms" },
];

// ─── Developer Portal ─────────────────────────────────────────────────────────

export default function DeveloperPortal() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileTab, setProfileTab] = useState(null); // null = modal closed
  const [viewRequest, setViewRequest] = useState(null); // {id, token} | null

  function openProfile(tab) {
    setProfileMenuOpen(false);
    setProfileTab(tab);
  }

  function handleViewWebsite(id) {
    setProfileTab(null); // close the profile modal
    setSearchParams({ tab: "browse" }); // switch to the Browse tab
    setViewRequest({ id, token: Date.now() });
  }

  return (
    <div className="flex flex-col md:flex-row bg-[#f5efe6] md:h-screen md:h-[100dvh] md:overflow-hidden">
      {/* ── Sidebar (Desktop, in normal flow) / Fixed Bottom Nav (Mobile) ── */}
      <aside
        className={`fixed bottom-0 left-0 right-0 md:static bg-white border-t md:border-t-0 md:border-r border-[#e8ddd2] flex flex-row md:flex-col transition-all duration-300 shrink-0 md:order-first z-40
        w-full h-16 md:h-auto ${collapsed ? "md:w-[68px]" : "md:w-60"}`}
      >
        {/* Logo / Toggle - Desktop Only */}
        <div className="hidden md:flex h-16 border-b border-[#e8ddd2] items-center justify-between px-4 shrink-0 w-full">
          {!collapsed ? (
            <>
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="flex items-center gap-2 hover:cursor-pointer shrink-0"
              >
                <img
                  src="/logo.svg"
                  alt="WebStore logo"
                  className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg object-cover bg-white"
                />
                <span className="font-semibold text-[#c4956a] text-[15px] truncate">
                  Dev Portal
                </span>
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="size-7 rounded-md flex items-center justify-center text-[#999] hover:text-[#c4956a] hover:bg-[#f5efe6] transition-colors shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex items-center gap-2 hover:cursor-pointer shrink-0"
            >
              <img
                src="/logo.svg"
                alt="WebStore logo"
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg object-cover bg-white"
              />
              <span className="font-semibold text-[#c4956a] text-[15px] truncate">
                Dev Portal
              </span>
            </button>
          )}
        </div>

        {/* Expand control when sidebar is collapsed */}
        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-[#e8ddd2] shrink-0">
            <button
              onClick={() => setCollapsed(false)}
              className="size-7 rounded-md flex items-center justify-center text-[#999] hover:text-[#c4956a] hover:bg-[#f5efe6] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 flex md:flex-col md:py-3 overflow-x-auto md:overflow-y-auto justify-around md:justify-start items-center md:items-stretch scrollbar-none snap-x">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setSearchParams({ tab: id })}
                title={label}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-sm transition-all flex-1 md:flex-initial h-full md:h-auto shrink-0 snap-center ${
                  active
                    ? "bg-[#f5efe6] text-[#c4956a] font-medium border-t-2 md:border-t-0 md:border-r-2 border-[#c4956a]"
                    : "text-[#555] hover:bg-[#faf7f3] hover:text-[#c4956a]"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span
                  className={collapsed ? "hidden" : "hidden md:block truncate"}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── User section at bottom (Desktop Only) ── */}
        <div className="hidden md:block border-t border-[#e8ddd2] relative shrink-0 w-full">
          {/* Fixed Profile popup menu - flies out to the right if collapsed */}
          {profileMenuOpen && (
            <div
              className={`absolute bg-white border border-[#e8ddd2] rounded-xl shadow-lg overflow-hidden z-50 w-56 ${
                collapsed
                  ? "bottom-0 left-full ml-2"
                  : "bottom-full left-0 right-0 w-auto rounded-b-none rounded-t-xl"
              }`}
            >
              {PROFILE_MENU.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => openProfile(id)}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#f5efe6] hover:text-[#c4956a] transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="border-t border-[#f0ebe4]">
                <button
                  onClick={() => logout(navigate)}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* User card trigger */}
          <button
            onClick={() => setProfileMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-4 hover:bg-[#f5efe6] transition-colors"
            title={collapsed ? user?.name : undefined}
          >
            <div className="size-9 rounded-full bg-[#c4956a] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[#111] text-xs font-semibold truncate">
                      {user?.name}
                    </p>
                    <span className="shrink-0 bg-[#c4956a] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none tracking-wide">
                      DEV
                    </span>
                  </div>
                  <p className="text-[#999] text-[11px] truncate capitalize">
                    {user?.role}
                  </p>
                </div>
                <ChevronUp
                  size={14}
                  className={`text-[#bbb] shrink-0 transition-transform duration-200 ${
                    profileMenuOpen ? "" : "rotate-180"
                  }`}
                />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col md:overflow-hidden min-w-0 pb-16 md:pb-0">
        {/* Responsive Header */}
        <header className="h-16 bg-white border-b border-[#e8ddd2] flex items-center justify-between px-4 md:px-6 shrink-0 relative sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES?.HOME || "/")}
              title="Back to Store"
              className="md:hidden size-8 rounded-lg flex items-center justify-center text-white shadow-sm hover:bg-[#b08359] transition-colors overflow-hidden"
            >
              <img
                src="/logo.svg"
                alt="WebStore"
                className="w-5 h-5 object-contain"
              />
            </button>
            <h1 className="font-semibold text-[#1a1a1a] text-base md:text-lg">
              {PAGE_TITLES[activeTab]}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            <button
              onClick={() => navigate(ROUTES?.HOME || "/")}
              className="hidden md:block px-3 py-1.5 text-sm text-[#555] border border-[#e8ddd2] rounded-lg hover:bg-[#f5efe6] transition-colors"
            >
              ← Back to Store
            </button>
            <NotificationBell />
            {/* Mobile Profile Dropdown Activator */}
            <div className="relative md:hidden">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="size-8 rounded-full bg-[#c4956a] flex items-center justify-center text-white text-xs font-semibold"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>

              {profileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#e8ddd2] rounded-xl shadow-lg overflow-hidden z-50">
                  {PROFILE_MENU.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => openProfile(id)}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#f5efe6] hover:text-[#c4956a] transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-[#f0ebe4]">
                    <button
                      onClick={() => logout(navigate)}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => logout(navigate)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Content Frame */}
        <main className="flex-1 md:overflow-y-auto p-4 md:p-6">
          {activeTab === "dashboard" && <DeveloperDashboard />}
          {activeTab === "my-websites" && <DeveloperMyWebsites />}
          {activeTab === "browse" && (
            <DeveloperBrowseWebsites
              key={viewRequest?.token ?? "default"}
              initialSelectedId={viewRequest?.id ?? null}
            />
          )}
          {activeTab === "audit" && <DeveloperAudit />}
          {activeTab === "support" && <DeveloperSupport />}
        </main>
      </div>

      {/* Profile modal */}
      {profileTab && (
        <DevProfileModal
          defaultTab={profileTab}
          onClose={() => setProfileTab(null)}
          onViewWebsite={handleViewWebsite}
        />
      )}
    </div>
  );
}

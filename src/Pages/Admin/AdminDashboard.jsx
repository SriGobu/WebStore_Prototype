import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Globe,
  ArrowUpCircle,
  Star,
  Flag,
  LifeBuoy,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Settings,
  ChevronUp,
  Code,
  CheckSquare,
} from "lucide-react";
import useAuthStore from "../../Store/authStore";
import { adminLogout } from "../../Services/Admin/authService";
import { logout } from "../../Utils/logout";
import Toast from "../../Components/Common/Toast";
import ROUTES from "../../Constants/routeConstants";

// ── Tab content imports ───────────────────────────────────────────────────────
import AdminOverview from "./Tabs/AdminOverview";
import AdminBrowseWebsites from "./Tabs/AdminBrowseWebsites";
import AdminUsers from "./Tabs/AdminUsers";
import AdminDevelopers from "./Tabs/AdminDevelopers";
import AdminWebsiteApproval from "./Tabs/AdminWebsiteApproval";
import AdminPromotions from "./Tabs/AdminPromotions";
import AdminReviewsReplies from "./Tabs/AdminReviewsReplies";
import AdminReports from "./Tabs/AdminReports";
import AdminSupport from "./Tabs/AdminSupport";
import AdminAuditLog from "./Tabs/AdminAuditLog";
import NotificationBell from "../../Components/Common/NotificationBell";
// ── Profile modal imports ─────────────────────────────────────────────────────
import AdminProfileModal from "./AdminProfileModal";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "browse", label: "Browse Websites", icon: Globe },
  { id: "users", label: "Users", icon: Users },
  { id: "developers", label: "Developers", icon: Code },
  { id: "approval", label: "Website Approval", icon: CheckSquare },
  { id: "promotions", label: "Promotions", icon: ArrowUpCircle },
  { id: "reviews", label: "Reviews & Replies", icon: Star },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "tickets", label: "Tickets", icon: LifeBuoy },
  { id: "audit", label: "Audit Log", icon: ClipboardList },
];

const PAGE_TITLES = {
  overview: "Dashboard",
  browse: "Browse Websites",
  users: "Users",
  developers: "Developers",
  approval: "Website Approval",
  promotions: "Promotions",
  reviews: "Reviews & Replies",
  reports: "Reports",
  tickets: "Support Tickets",
  audit: "Audit Log",
};

// 🆕 Added "Settings" alongside "Account Overview"
const PROFILE_MENU = [
  { id: "account", label: "Account Overview", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [collapsed, setCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileTab, setProfileTab] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const onToast = useCallback((msg) => setToastMessage(msg), []);

  function openProfile(id) {
    setProfileMenuOpen(false);
    setProfileTab(id);
  }

  async function handleLogout() {
    try {
      // Backend logout
      await adminLogout(); // your service
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      // Always perform local cleanup
      logout(navigate);
    }
  }

  return (
    <div className="flex flex-col md:flex-row bg-[#f5efe6] md:h-screen md:h-[100dvh] md:overflow-hidden">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

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
                <span className="font-semibold text-[#334155] text-[15px] truncate">
                  Admin Panel
                </span>
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="size-7 rounded-md flex items-center justify-center text-[#999] hover:text-[#334155] hover:bg-[#f1f5f9] transition-colors shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate(ROUTES?.HOME || "/")}
              title="Back to Store"
              className="size-8 rounded-lg flex items-center justify-center mx-auto overflow-hidden"
            >
              <img
                src="/logo.svg"
                alt="WebStore"
                className="w-5 h-5 object-contain"
              />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-[#e8ddd2] shrink-0">
            <button
              onClick={() => setCollapsed(false)}
              className="size-7 rounded-md flex items-center justify-center text-[#999] hover:text-[#334155] hover:bg-[#f1f5f9] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation Layer */}
        <nav className="flex-1 flex md:flex-col md:py-3 overflow-x-auto md:overflow-y-auto justify-start items-center md:items-stretch scrollbar-none snap-x">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setSearchParams({ tab: id })}
                title={label}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-4 md:px-4 py-2 md:py-2.5 text-[10px] md:text-sm transition-all shrink-0 snap-center h-full md:h-auto min-w-[76px] md:min-w-0 ${
                  active
                    ? "bg-[#f1f5f9] text-[#334155] font-medium border-t-2 md:border-t-0 md:border-r-2 border-[#334155]"
                    : "text-[#555] hover:bg-[#faf7f3] hover:text-[#334155]"
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

        {/* ── User card section (Desktop Only) ── */}
        <div className="hidden md:block border-t border-[#e8ddd2] relative shrink-0 w-full">
          {profileMenuOpen && (
            <div
              className={`absolute bg-white border border-[#e8ddd2] rounded-xl shadow-lg overflow-hidden z-10 w-56 ${
                collapsed
                  ? "bottom-0 left-full ml-2"
                  : "bottom-full left-0 right-0 w-auto rounded-b-none rounded-t-xl"
              }`}
            >
              {PROFILE_MENU.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => openProfile(id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors"
                >
                  <Icon size={14} className="shrink-0 text-[#999]" />
                  {label}
                </button>
              ))}
              <div className="border-t border-[#f0ebe4]">
                <button
                  onClick={() => handleLogout()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} className="shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* User card */}
          <button
            onClick={() => setProfileMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 p-4 hover:bg-[#f1f5f9] transition-colors"
            title={collapsed ? user?.name : undefined}
          >
            <div className="size-9 rounded-full bg-[#334155] flex items-center justify-center shrink-0">
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
                    <span className="shrink-0 bg-[#334155] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none tracking-wide">
                      ADMIN
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

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col md:overflow-hidden min-w-0 pb-16 md:pb-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#e8ddd2] flex items-center justify-between px-4 md:px-6 shrink-0 relative sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES?.HOME || "/")}
              title="Back to Store"
              className="md:hidden size-8 rounded-lg flex items-center justify-center text-white shadow-sm hover:bg-[#1e293b] transition-colors overflow-hidden"
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
            <div className="relative md:hidden">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="size-8 rounded-full bg-[#334155] flex items-center justify-center text-white text-xs font-semibold"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>

              {profileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#e8ddd2] rounded-xl shadow-lg overflow-hidden z-50">
                  {PROFILE_MENU.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => openProfile(id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors"
                    >
                      <Icon size={14} className="shrink-0 text-[#999]" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-[#f0ebe4]">
                    <button
                      onClick={() => logout(navigate)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} className="shrink-0" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[#888] text-sm">Admin</span>
            </div>
            <button
              onClick={() => handleLogout()}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 md:overflow-y-auto p-4 md:p-6">
          {activeTab === "overview" && <AdminOverview />}
          {activeTab === "browse" && <AdminBrowseWebsites />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "developers" && <AdminDevelopers />}
          {activeTab === "approval" && <AdminWebsiteApproval />}
          {activeTab === "promotions" && <AdminPromotions />}
          {activeTab === "reviews" && <AdminReviewsReplies />}
          {activeTab === "reports" && <AdminReports />}
          {activeTab === "tickets" && <AdminSupport />}
          {activeTab === "audit" && <AdminAuditLog />}
        </main>
      </div>

      {/* Profile modal */}
      {profileTab && (
        <AdminProfileModal
          defaultTab={profileTab}
          onClose={() => setProfileTab(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

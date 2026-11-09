import { useState, useEffect } from "react";
import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../../Components/User/Header";
import Footer from "../../Components/Common/Footer";
import Toast from "../../Components/Common/Toast";
import AccountOverview from "../../Pages/User/ProfileTabs/AccountOverview";
import AccountSettings from "../../Pages/User/ProfileTabs/AccountSettings";
import BecomeDeveloper from "../../Pages/User/ProfileTabs/BecomeDeveloper";
import MyActivity from "../../Pages/User/ProfileTabs/MyActivity";
import Support from "../../Pages/User/ProfileTabs/Support";
import AboutLegal from "../../Pages/User/ProfileTabs/AboutLegal";
import useAuthStore from "../../Store/authStore";
import { logout } from "../../Utils/logout";
import ROUTES from "../../Constants/routeConstants";
import NotificationSettings from "../../Components/User/NotificationSettings";

const TABS = [
  { key: "overview", label: "Account Overview" },
  { key: "settings", label: "Account Settings" },
  { key: "activity", label: "My Activity" },
  { key: "notifications", label: "Notification Settings" },
  { key: "developer", label: "Become a Developer" },
  { key: "support", label: "Support & Feedback" },
  { key: "about", label: "About & Legal" },
];

// maps Header dropdown's `section` query param to this page's tab keys
const sectionToTab = {
  account: "overview",
  settings: "settings",
  notifications: "notifications",
  activity: "activity",
  developer: "developer",
  support: "support",
  about: "about",
};

const tabToSection = {
  overview: "account",
  settings: "settings",
  notifications: "notifications",
  activity: "activity",
  developer: "developer",
  support: "support",
  about: "about",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = sectionToTab[searchParams.get("section")] ?? "overview";
  const [toastMessage, setToastMessage] = useState("");

  const onToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  function handleLogout() {
    logout(navigate, (msg) => setToastMessage(msg));
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  return (
    <div className="bg-[#f5efe6] min-h-screen w-full overflow-x-hidden flex flex-col justify-between">
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-light text-[#767676] mb-6">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="hover:underline"
          >
            WebStore
          </button>
          <span>›</span>
          <span>Account</span>
          <span>›</span>
          <span className="capitalize">
            {TABS.find((t) => t.key === activeTab)?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="hidden md:block md:col-span-2">
            <div className="bg-[#fafafa] rounded-xl shadow-md p-4 sticky top-24">
              {/* User summary */}
              <div className="flex items-center gap-3 px-2 py-3 mb-3 border-b border-[#e0d9d0]">
                <div className="size-9 rounded-full bg-[#c4956a] flex items-center justify-center shrink-0">
                  <span className="font-semibold text-white text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#111] text-sm truncate">
                    {user?.name}
                  </p>
                  <p className="font-light text-[#767676] text-xs truncate capitalize">
                    {user?.role ?? "User"}
                  </p>
                </div>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() =>
                      setSearchParams({
                        section: tabToSection[key],
                      })
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                      activeTab === key
                        ? "bg-[#c4956a] text-white font-medium"
                        : "text-[#333] hover:bg-[#f5efe6]"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <div className="pt-3 border-t border-[#e0d9d0]">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="col-span-1 md:col-span-2">
            {activeTab === "overview" && <AccountOverview onToast={onToast} />}
            {activeTab === "settings" && <AccountSettings onToast={onToast} />}
            {activeTab === "notifications" && (
              <NotificationSettings onToast={onToast} />
            )}
            {activeTab === "activity" && <MyActivity onToast={onToast} />}
            {activeTab === "developer" && <BecomeDeveloper onToast={onToast} />}
            {activeTab === "support" && <Support onToast={onToast} />}
            {activeTab === "about" && <AboutLegal />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// review popup notification
// push notification from your tab
// getting website from direct google search
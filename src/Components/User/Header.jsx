/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  ClipboardList,
  Briefcase,
  LifeBuoy,
  FileText,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";
import ROUTES from "../../Constants/routeConstants";
import useAuthStore from "../../Store/authStore";
import { logout } from "../../Utils/logout";
import SearchOverlay from "../Common/SearchOverlay";
import NotificationBell from "../Common/NotificationBell";

const MENU_ITEMS = [
  {
    icon: User,
    label: "Account Overview",
    desc: "Manage your account",
    section: "account",
  },
  {
    icon: Settings,
    label: "Settings",
    desc: "Preferences & privacy",
    section: "settings",
  },
  {
    icon: Bell,
    label: "Notifications",
    desc: "Manage alerts",
    section: "notifications",
  },
  {
    icon: ClipboardList,
    label: "My Activity",
    desc: "Reviews & wishlist",
    section: "activity",
  },
  {
    icon: Briefcase,
    label: "Become a Developer",
    desc: "Publish your apps",
    section: "developer",
  },
  {
    icon: LifeBuoy,
    label: "Support & Help",
    desc: "Get assistance",
    section: "support",
  },
  {
    icon: FileText,
    label: "About & Legal",
    desc: "Terms & privacy policy",
    section: "about",
  },
];

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout(navigate, (msg) => setToast(msg));
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <>
      <header className="bg-[#fafafa] border-b border-[#e0d9d0] sticky top-0 z-50 w-full">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          {/* Left — Logo (unchanged) */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex items-center gap-0 hover:cursor-pointer shrink-0"
            >
              <img
                src="/logo.svg"
                alt="WebStore logo"
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg object-cover bg-white"
              />
            </button>
            <span className="font-semibold text-[#c4956a] text-base sm:text-lg truncate">
              WebStore
            </span>
          </div>

          {/* Right — Search + Profile OR Login/Signup */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 min-w-0">
            <SearchOverlay />
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              /* ── Logged in: existing profile dropdown, unchanged ── */
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-full hover:bg-[#f5efe6] transition-colors hover:cursor-pointer"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#c4956a] flex items-center justify-center shadow-sm shrink-0">
                    <span className="font-semibold text-white text-xs sm:text-sm">
                      {initial}
                    </span>
                  </div>
                  <span className="text-[#333] text-sm font-medium truncate max-w-[120px] hidden sm:inline">
                    {user?.name}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-[#767676] transition-transform duration-200 shrink-0 ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-[#e0d9d0] overflow-hidden z-50">
                    <div className="bg-[#f5efe6] px-4 sm:px-5 py-4 flex items-center gap-3 border-b border-[#e0d9d0]">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#c4956a] flex items-center justify-center shadow-sm shrink-0">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {initial}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111] text-sm truncate">
                          {user?.name}
                        </p>
                        <p className="text-[#767676] text-xs mt-0.5 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="py-2">
                      {MENU_ITEMS.map(
                        ({ icon: Icon, label, desc, section }) => (
                          <button
                            key={section}
                            onClick={() => {
                              navigate(`/profile?section=${section}`);
                              setShowDropdown(false);
                            }}
                            className="hover:cursor-pointer w-full text-left px-4 sm:px-5 py-3 hover:bg-[#f5efe6] transition-colors flex items-center gap-3 group"
                          >
                            <span className="w-8 h-8 rounded-full bg-[#f5efe6] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors">
                              <Icon size={15} className="text-[#c4956a]" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[#111] text-sm font-medium truncate">
                                {label}
                              </p>
                              <p className="text-[#767676] text-xs truncate">
                                {desc}
                              </p>
                            </div>
                          </button>
                        ),
                      )}
                    </div>

                    <div className="border-t border-[#e0d9d0] mx-4 mb-1" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowDropdown(false);
                      }}
                      className="hover:cursor-pointer w-full text-left px-4 sm:px-5 py-3 mb-1 hover:bg-red-50 transition-colors flex items-center gap-3 group"
                    >
                      <span className="w-8 h-8 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
                        <LogOut size={15} className="text-red-500" />
                      </span>
                      <div>
                        <p className="text-red-600 text-sm font-medium">
                          Logout
                        </p>
                        <p className="text-red-400 text-xs">
                          Sign out of your account
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Logged out: Login / Sign up buttons ── */
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="px-3 sm:px-4 py-2 rounded-full text-sm font-medium text-[#1a1a1a] hover:bg-[#f5efe6] transition-colors hover:cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="px-3 sm:px-4 py-2 rounded-full text-sm font-medium bg-[#c4956a] text-white hover:bg-[#b3825a] transition-colors hover:cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

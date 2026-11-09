import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  Activity,
  Settings,
  Shield,
  LogOut,
  Bell,
} from "lucide-react";
import useAuthStore from "../../Store/authStore";
import { logout } from "../../Utils/logout";
import { useNavigate } from "react-router-dom";

const MENU_ITEMS = [
  { id: "overview", label: "Account Overview", icon: LayoutDashboard },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "legal", label: "Privacy & Terms", icon: Shield },
];

export default function DevProfileDropdown({ onSelect }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(id) {
    setOpen(false);
    onSelect(id);
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#e8ddd2] bg-white hover:bg-[#f5efe6] transition-colors"
      >
        <div className="size-7 rounded-full bg-[#c4956a] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-[13px] font-medium text-[#1a1a1a] hidden sm:block max-w-[100px] truncate">
          {user?.name?.split(" ")[0]}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#888] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-xl border border-[#e8ddd2] overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-[#f0ebe4] bg-[#faf7f3]">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-[#c4956a] flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#1a1a1a] truncate">
                  {user?.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-[10px] text-[#888] capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <nav className="py-1.5">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#f5efe6] hover:text-[#c4956a] transition-colors"
              >
                <Icon size={15} className="shrink-0 text-[#aaa]" />
                {label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-[#f0ebe4] py-1.5">
            <button
              onClick={() => logout(navigate)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} className="shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

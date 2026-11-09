import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../../Services/Common/notificationService";

const POLL_INTERVAL = 60_000; // refresh unread count every 60s

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const res = await getNotifications();

        const fetchedNotifications =
          res?.data?.notifications || res?.notifications || [];
        const fetchedUnreadCount =
          res?.data?.unreadCount ?? res?.unreadCount ?? 0;

        // Only update state if the component is still mounted
        if (isMounted) {
          setNotifications(
            Array.isArray(fetchedNotifications) ? fetchedNotifications : [],
          );
          setUnreadCount(
            typeof fetchedUnreadCount === "number" ? fetchedUnreadCount : 0,
          );
        }
      } catch (err) {
        console.error("Failed to load notifications:", err.message);
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    }

    // Initial load
    loadNotifications();

    // Polling interval
    const interval = setInterval(loadNotifications, POLL_INTERVAL);

    // Cleanup to prevent setting state on unmounted component
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Empty dependency array is now completely safe

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotificationClick(notif) {
    if (!notif.isRead) {
      await markAsRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.link) navigate(notif.link, { replace: false }); // safe now that links match real routes
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative size-9 rounded-full flex items-center justify-center hover:bg-[#f5efe6] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-[#555]" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-[#e0d9d0] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0d9d0]">
            <span className="font-semibold text-sm text-[#111]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#c4956a] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-[#999] py-8">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => {
                    handleNotificationClick(notif);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-[#f0ebe4] hover:bg-[#f5efe6] transition-colors ${
                    !notif.isRead ? "bg-[#fdf8f2]" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="mt-1.5 size-1.5 rounded-full bg-[#c4956a] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-[#767676] mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-[#bbb] mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

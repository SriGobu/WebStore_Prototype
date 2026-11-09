import { useEffect, useState } from "react";
import NotificationToggle from "../Common/NotificationToggle";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../Services/Common/notificationService";

const CATEGORIES = [
  { key: "followedDeveloper", label: "Followed developer uploads" },
  { key: "newWebsitesDigest", label: "Daily digest of new websites" },
  { key: "reviewActivity", label: "Review replies & votes" },
  { key: "ticketsResolved", label: "Reports & tickets resolved" },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState({});
  const masterEnabled = prefs.notificationsEnabled ?? true;

  useEffect(() => {
    getNotificationPreferences().then((res) => setPrefs(res.data));
  }, []);
  
  async function toggleMaster() {
    const previous = prefs;
    const enabled = !previous.notificationsEnabled;

    const updated = Object.keys(previous).reduce((acc, key) => {
      acc[key] = enabled;
      return acc;
    }, {});

    updated.notificationsEnabled = enabled;

    setPrefs(updated);

    try {
      await updateNotificationPreferences(updated);
    } catch {
      setPrefs(previous);
    }
  }

  async function toggle(key) {
    const previous = prefs;

    const updated = {
      ...previous,
      [key]: !previous[key],
    };

    setPrefs(updated);

    try {
      await updateNotificationPreferences(updated);
    } catch {
      setPrefs(previous);
    }
  }

  return (
    <div>
      <div className="pb-3 mb-2 border-b border-[#e0d9d0]">
        <NotificationToggle
          label="Enable Notifications"
          enabled={masterEnabled}
          onChange={toggleMaster}
        />
      </div>

      {masterEnabled &&
        CATEGORIES.map(({ key, label }) => (
          <NotificationToggle
            key={key}
            label={label}
            enabled={!!prefs[key]}
            onChange={() => toggle(key)}
          />
        ))}

      <p className="text-xs text-[#999] pt-2">
        Account & security notifications are always on.
      </p>
    </div>
  );
}

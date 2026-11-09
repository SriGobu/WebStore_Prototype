import { useEffect, useState } from "react";
import NotificationToggle from "../Common/NotificationToggle";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../Services/Common/notificationService";

const CATEGORIES = [
  { key: "userLifecycle", label: "New registrations & developer requests" },
  { key: "moderationQueue", label: "Pending website approvals & reports" },
  { key: "support", label: "New support tickets" },
  { key: "contentActivity", label: "New reviews & replies (all activity)" },
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
    </div>
  );
}

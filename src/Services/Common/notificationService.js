import api from "../../Config/axios";

// ── Preferences ─────────────────────────────────────────────────────────────────
export const getNotificationPreferences = async () => {
  return await api.get(`/notifications/preferences`);
};

export const updateNotificationPreferences = async (preferences) => {
  return await api.patch(`/notifications/preferences`, {
    preferences,
  });
};

// ── In-app notification list ────────────────────────────────────────────────────
export const getNotifications = async () => {
  return await api.get(`/notifications`);
};

export const markAsRead = async (id) => {
  return await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  return await api.patch(`/notifications/read-all`);
};

export const deleteNotification = async (id) => {
  return await api.delete(`/notifications/${id}`);
};


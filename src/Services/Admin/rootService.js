import api from "../../Config/axios";

// ─── Users ────────────────────────────────────────────────────────────────────
export const getAllUsers = (params) => api.get("/admin/users", { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const banUser = (id) => api.patch(`/admin/users/${id}/ban`);
export const unbanUser = (id) => api.patch(`/admin/users/${id}/unban`);
export const demoteToUser = (id) => api.patch(`/admin/users/${id}/demote`);

// ─── Websites ─────────────────────────────────────────────────────────────────
export const getAllWebsites = (params) =>
  api.get("/admin/websites", { params });
export const getPendingWebsites = () => api.get("/admin/websites/pending");
export const getWebsiteById = (id) => api.get(`/admin/websites/${id}`);
export const getWebsiteStats = (id) => api.get(`/admin/websites/${id}/stats`);
export const deleteWebsite = (id) => api.delete(`/admin/websites/${id}`);
export const approveWebsite = (id) =>
  api.patch(`/admin/websites/${id}/approve`);
export const rejectWebsite = (id, data) =>
  api.patch(`/admin/websites/${id}/reject`, data);

export const createWebsite = (data) => api.post("/admin/websites", data);
export const updateWebsite = (id, data) =>
  api.patch(`/admin/websites/${id}`, data);

export const recheckWebsiteHealth = (id) =>
  api.post(`/admin/websites/${id}/health-check`);

export const uploadIcon = (id, file) => {
  const form = new FormData();
  form.append("icon", file);
  return api.patch(`/admin/websites/${id}/icon`, form);
};
export const updateIcon = (id, file) => {
  const form = new FormData();
  form.append("icon", file);
  return api.patch(`/admin/websites/${id}/icon/update`, form);
};
export const uploadScreenshots = (id, files) => {
  const form = new FormData();
  files.forEach((f) => form.append("screenshots", f));
  return api.patch(`/admin/websites/${id}/screenshots`, form);
};
export const updateScreenshot = (id, screenshotId, file) => {
  const form = new FormData();
  form.append("screenshot", file);
  return api.patch(`/admin/websites/${id}/screenshots/${screenshotId}`, form);
};

// ─── Promotions ───────────────────────────────────────────────────────────────
export const getAllPromotions = () => api.get("/admin/promotions");
export const approvePromotion = (id, data) =>
  api.patch(`/admin/promotions/${id}/approve`, data);
export const rejectPromotion = (id, data) =>
  api.patch(`/admin/promotions/${id}/reject`, data);

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const getAllReviews = () => api.get("/admin/reviews");
export const deleteReview = (id) => api.delete(`/admin/reviews/${id}`);
export const hideReview = (id) => api.patch(`/admin/reviews/${id}/hide`);
export const unhideReview = (id) => api.patch(`/admin/reviews/${id}/unhide`);

// ─── Replies ──────────────────────────────────────────────────────────────────
export const getAllReplies = () => api.get("/admin/replies");
export const deleteReply = (id) => api.delete(`/admin/replies/${id}`);
export const hideReply = (id) => api.patch(`/admin/replies/${id}/hide`);
export const unhideReply = (id) => api.patch(`/admin/replies/${id}/unhide`);

// ─── Support Tickets ──────────────────────────────────────────────────────────
export const getAllTickets = (params) => api.get("/admin/support", { params });
export const getTicketById = (id) => api.get(`/admin/support/${id}`);
export const resolveTicket = (id, data) =>
  api.patch(`/admin/support/${id}/resolve`, data);
export const deleteTicket = (id) => api.delete(`/admin/support/${id}`);

// ─── Reports ──────────────────────────────────────────────────────────────────
export const getAllReports = (params) => api.get("/admin/reports", { params });
export const resolveReport = (id) => api.patch(`/admin/reports/${id}/resolve`);
export const dismissReport = (id) => api.patch(`/admin/reports/${id}/dismiss`);
export const deleteReport = (id) => api.delete(`/admin/reports/${id}`);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const getAuditLogs = (params) =>
  api.get("/admin/audit-logs", { params });

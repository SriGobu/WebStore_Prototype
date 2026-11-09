import api from "../../Config/axios";

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const renderAllReviews = async (websiteId) =>
  api.get(`/dev/websites/${websiteId}/reviews`);

export const createReview = (websiteId, data) =>
  api.post(`/dev/websites/${websiteId}/reviews`, data);

export const updateReview = (websiteId, data) =>
  api.patch(`/dev/websites/${websiteId}/reviews`, data);

export const deleteReview = (websiteId) =>
  api.delete(`/dev/websites/${websiteId}/reviews`);

export const getMyReviews = (params) =>
  api.get("/dev/profile/reviews", { params });

export const getWebsiteReviews = (websiteId, params) =>
  api.get(`/dev/websites/${websiteId}/reviews`, { params });

export const getMyWebsiteReviews = (websiteId, params) =>
  api.get(`/dev/websites/reviews/${websiteId}`, { params });

export const voteReview = (reviewId, voteType) =>
  api.post(`/dev/reviews/${reviewId}/vote`, { voteType });

// ─── Replies ──────────────────────────────────────────────────────────────────

export const createReply = (reviewId, data) =>
  api.post(`/dev/reviews/${reviewId}/replies`, data);

export const updateReply = (replyId, data) =>
  api.patch(`/dev/replies/${replyId}`, data);

export const deleteReply = (replyId) => api.delete(`/dev/replies/${replyId}`);

export const getRepliesByReview = (reviewId, params) =>
  api.get(`/dev/reviews/${reviewId}/replies`, { params });

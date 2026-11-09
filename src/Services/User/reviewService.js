import api from "../../Config/axios";

export const renderAllReviews = async (websiteId) =>
  api.get(`/user/websites/${websiteId}/reviews`);

export const createReview = async (websiteId, reviewData) =>
  api.post(`/user/websites/${websiteId}/reviews`, reviewData);

export const updateReview = async (websiteId, reviewData) =>
  api.patch(`/user/websites/${websiteId}/reviews`, reviewData);

export const deleteReview = async (websiteId) =>
  api.delete(`/user/websites/${websiteId}/reviews`);

// GET /api/user/reviews/:id/replies — id = reviewId
export function getRepliesByReview(reviewId, params = {}) {
  return api.get(`/user/reviews/${reviewId}/replies`, { params });
}
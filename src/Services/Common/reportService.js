import api from "../../Config/axios";

export function reportReview(reviewId, payload) {
  return api.post(`/user/reviews/${reviewId}/report`, {
    ...payload,
    targetType: "review",
  });
}

export function reportWebsite(websiteId, payload) {
  return api.post(`/user/websites/${websiteId}/report`, {
    ...payload,
    targetType: "website",
  });
}

export function voteReview(reviewId, voteType) {
  return api.post(`/user/reviews/${reviewId}/vote`, { voteType });
}

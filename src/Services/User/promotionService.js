import api from "../../Config/axios";

// GET /api/user/promotions/status
export function getPromotionStatus() {
  return api.get("/user/promotions/status");
}

// POST /api/user/promotions/request
export function requestPromotion(reason) {
  return api.post("/user/promotions/request", { reason });
}

// DELETE /api/user/promotions/:id
export function deletePromotionRequest(id) {
  return api.delete(`/user/promotions/${id}`);
}

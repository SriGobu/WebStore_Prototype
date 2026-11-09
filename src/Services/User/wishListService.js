import api from "../../Config/axios";

// GET /api/user/wishlist
export function getWishlist(params = {}) {
  return api.get("/user/wishlist", { params });
}

// POST /api/user/wishlist/:id — id = websiteId
export function addToWishlist(websiteId) {
  return api.post(`/user/wishlist/${websiteId}`);
}

// DELETE /api/user/wishlist/:id — id = websiteId
export function removeFromWishlist(websiteId) {
  return api.delete(`/user/wishlist/${websiteId}`);
}

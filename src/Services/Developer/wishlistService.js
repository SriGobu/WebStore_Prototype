import api from "../../Config/axios";

export const getWishlist = () =>
  api.get("/dev/wishlist");

export const addToWishlist = (websiteId) =>
  api.post(`/dev/wishlist/${websiteId}`);

export const removeFromWishlist = (websiteId) =>
  api.delete(`/dev/wishlist/${websiteId}`);
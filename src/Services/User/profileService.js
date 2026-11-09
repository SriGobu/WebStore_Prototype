import api from "../../Config/axios";

// GET /api/user/profile
export function getProfile() {
  return api.get("/user/profile");
}

// PATCH /api/user/profile/name
export function updateName(name) {
  return api.patch("/user/profile/name", { name });
}

// POST /api/user/profile/email/initiate
export function initiateEmailChange(newEmail) {
  return api.post("/user/profile/email/initiate", { newEmail });
}

// POST /api/user/profile/email/verify
export function verifyEmailChange(newEmail, otp) {
  return api.post("/user/profile/email/verify", { newEmail, otp });
}

// POST /api/user/profile/email/resend-otp
export function resendEmailChangeOtp(newEmail) {
  return api.post("/user/profile/email/resend-otp", { newEmail });
}

// GET /api/user/profile/reviews
export function getMyReviews(params = {}) {
  return api.get("/user/profile/reviews", { params });
}

// DELETE /api/user/profile
export function deleteAccount({ deleteContentToo = false } = {}) {
  return api.delete("/user/profile", { data: { deleteContentToo } });
}

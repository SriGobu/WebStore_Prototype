import api from "../../Config/axios";

// GET /api/dev/profile
export function getProfile() {
  return api.get("/dev/profile");
}

// PATCH /api/dev/profile/name
export function updateName(name) {
  return api.patch("/dev/profile/name", { name });
}

// POST /api/dev/profile/email/initiate
export function initiateEmailChange(newEmail) {
  return api.post("/dev/profile/email/initiate", { newEmail });
}

// POST /api/dev/profile/email/verify
export function verifyEmailChange(newEmail, otp) {
  return api.post("/dev/profile/email/verify", { newEmail, otp });
}

// POST /api/dev/profile/email/resend-otp
export function resendEmailChangeOtp(newEmail) {
  return api.post("/dev/profile/email/resend-otp", { newEmail });
}

// GET /api/dev/profile/reviews
export function getMyReviews(params = {}) {
  return api.get("/dev/profile/reviews", { params });
}

// DELETE /api/dev/profile
export function deleteAccount({ deleteContentToo = false } = {}) {
  return api.delete("/dev/profile", { data: { deleteContentToo } });
}

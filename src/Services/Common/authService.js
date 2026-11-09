import api from "../../Config/axios";

export const registerUser = async (data) => api.post("/auth/register", data);

export const verifyOTP = async (data) => api.post("/auth/verify-otp", data);

export const resendOTP = async (data) => api.post("/auth/resend-otp", data);

export const loginUser = async (data) => api.post("/auth/login", data);

export const logoutUser = async () => api.post("/auth/logout");

export const refreshToken = async () => api.post("/auth/refresh-token");

export const requestPasswordReset = async (data) =>
  api.post("/auth/forgot-password", data);

export const verifyForgotPasswordOTP = async (data) =>
  api.post("/auth/verify-forgot-password-otp", data);

export const resetPassword = async (data) =>
  api.post("/auth/reset-password", data);

export const resendForgotPasswordOTP = async (data) =>
  api.post("/auth/resend-forgot-password-otp", data);

export const getCurrentUserRole = async () => api.get("/auth/me");

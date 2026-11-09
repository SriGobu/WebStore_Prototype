import api from "../../Config/axios";

export const adminLogin = async (data) => api.post("/admin/login", data);

export const adminLogout = async () => api.post("/admin/logout");
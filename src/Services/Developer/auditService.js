import api from "../../Config/axios";

export const getMyAuditLogs = async (params) =>
  api.get("/dev/audit", { params });

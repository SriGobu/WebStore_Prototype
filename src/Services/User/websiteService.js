import api from "../../Config/axios";

export const renderAllWebsites = async () => api.get("/user/websites");

export const incrementVisitCount = async (websiteId) =>
  api.post(`/user/websites/${websiteId}/visit`);

export const getWebsiteById = async (websiteId) =>
  api.get(`/user/websites/${websiteId}`);

export const getVisitedWebsites = async () => api.get("/user/websites/visited");

import api from "../../Config/axios";

export const submitTicket = (data) => api.post("/dev/support/tickets", data);

export const getMyTickets = (params) => api.get("/dev/support", { params });

export const getMyTicketById = (id) => api.get(`/dev/support/${id}`);

export const deleteMyTicket = (id) => api.delete(`/dev/support/${id}`);

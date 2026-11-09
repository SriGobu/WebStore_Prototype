import api from "../../Config/axios";

// POST /api/user/support/tickets — { subject, description }
export function submitTicket(payload) {
  return api.post("/user/support/tickets", payload);
}

// GET /api/user/support — { type?, status?, page?, limit? }
export function getMyTickets(params = {}) {
  return api.get("/user/support", { params });
}

// GET /api/user/support/:id
export function getMyTicketById(id) {
  return api.get(`/user/support/${id}`);
}

// DELETE /api/user/support/:id
export function deleteMyTicket(id) {
  return api.delete(`/user/support/${id}`);
}
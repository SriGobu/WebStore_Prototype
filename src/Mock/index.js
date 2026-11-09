// Single switch for the mock backend. Set VITE_USE_MOCK_API=false in .env to
// talk to the real API again — no page or service code needs to change.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export { default as mockAdapter } from "./mockAdapter";
export { resetDb } from "./mockDb";
export { DEMO_ACCOUNTS } from "./seedData";

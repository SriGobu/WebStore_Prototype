// Mock mode is the safe default so static deployments do not depend on a
// backend environment variable. Set VITE_USE_MOCK_API=false to use the API.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

export { default as mockAdapter } from "./mockAdapter";
export { resetDb } from "./mockDb";
export { DEMO_ACCOUNTS } from "./seedData";

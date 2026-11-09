import { dispatch, HttpError } from "./mockRoutes";

// Custom axios adapter: instead of sending the request over the network it is
// answered by the in-memory mock API. Interceptors in Config/axios.js still run
// exactly as they would against the real backend.

const LATENCY_MS = 150;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function readHeader(headers, name) {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name);
  return headers[name] ?? headers[name.toLowerCase()];
}

function buildAxiosError(message, status, config, data) {
  const error = new Error(message);
  error.isAxiosError = true;
  error.config = config;
  error.response = {
    status,
    statusText: message,
    data: data ?? { success: false, message },
    headers: {},
    config,
  };
  return error;
}

export default async function mockAdapter(config) {
  await wait(LATENCY_MS);

  const method = (config.method || "get").toUpperCase();
  const path = String(config.url || "")
    .split("?")[0]
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/api(?=\/)/, "");
  const authHeader = readHeader(config.headers, "Authorization");
  const token =
    typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";

  try {
    const body = await dispatch({
      method,
      path,
      query: config.params ?? {},
      rawBody: config.data,
      token,
    });
    return {
      data: JSON.parse(JSON.stringify(body)),
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    };
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err?.message || "Mock API error";
    throw buildAxiosError(message, status, config, {
      success: false,
      message,
    });
  }
}

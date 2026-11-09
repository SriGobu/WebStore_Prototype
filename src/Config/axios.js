import axios from "axios";
import useAuthStore from "../Store/authStore";
import AXIOS_CONFIG from "../Constants/apiConstants";
import { USE_MOCK_API, mockAdapter } from "../Mock";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true,
  timeout: AXIOS_CONFIG.API_TIMEOUT,
  // When mock mode is on, requests are answered in-browser by the mock API
  // (src/Mock) instead of the network. Interceptors below run unchanged.
  ...(USE_MOCK_API ? { adapter: mockAdapter } : {}),
});

// ---- request interceptor: attach access token ----

api.interceptors.request.use(
  (config) => {
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh-token",
      "/dev/login",
      "/admin/login",
    ];

    const isPublic = publicEndpoints.some((endpoint) =>
      config.url?.startsWith(endpoint),
    );

    if (!isPublic) {
      const token = useAuthStore.getState().getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(createErrorResponse(error));
  },
);

// ---- shared refresh state ----
// Ensures only ONE refresh-token request is ever in flight, even when
// multiple requests fail with 401 simultaneously (e.g. Promise.all).
// All concurrent 401s await the SAME refreshPromise instead of each
// independently triggering their own refresh call, which previously
// caused a race against refresh-token rotation on the backend.

let isRefreshing = false;
let refreshPromise = null;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const createErrorResponse = (error) => {
  const err = new Error();

  if (axios.isAxiosError(error)) {
    err.message =
      error.response?.data?.message || error.message || "Request failed";
    err.status = error.response?.status;
    err.data = error.response?.data;
  } else if (error instanceof Error) {
    err.message = error.message;
  } else {
    err.message = String(error) || "Unknown error";
  }

  return err;
};

const refreshAccessToken = async () => {
  try {
    const { user } = useAuthStore.getState();

    if (!user) {
      return Promise.reject(new Error("Invalid email or password"));
    }

    const refreshEndpoint =
      user?.role === "admin"
        ? "/admin/refresh-token"
        : AXIOS_CONFIG.REFRESH_TOKEN_ENDPOINT;

    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_API_BASE_URL}${refreshEndpoint}`,
      {},
      { withCredentials: true, timeout: AXIOS_CONFIG.API_TIMEOUT },
    );

    const newAccessToken =
      response.data?.data?.accessToken || response.data?.accessToken;

    if (!newAccessToken) {
      throw new Error("Invalid token refresh response structure");
    }

    useAuthStore.getState().setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (error) {
    useAuthStore.getState().clearAuth();
    window.location.href = "/";
    throw error;
  }
};

// ---- response interceptor: handle 401 with single shared refresh ----

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // not a 401, or already retried once — fail immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(createErrorResponse(error));
    }

    // mark this request as retried BEFORE any async work, closing the
    // race window where multiple requests could each think they're
    // "the first" to trigger a refresh
    originalRequest._retry = true;

    if (isRefreshing) {
      // a refresh is already in flight — wait for THAT SAME promise
      // instead of starting a second one
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(createErrorResponse(err)));
    }

    // this request is the one that triggers the refresh
    isRefreshing = true;
    refreshPromise = refreshAccessToken()
      .then((newToken) => {
        processQueue(null, newToken);
        return newToken;
      })
      .catch((refreshError) => {
        const formattedError = createErrorResponse(refreshError);
        processQueue(formattedError, null);
        throw formattedError;
      })
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });

    try {
      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;

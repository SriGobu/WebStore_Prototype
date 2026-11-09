import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => {
  const requestHandlers = [];
  const responseHandlers = [];

  const mockAxiosInstance = Object.assign(
    vi.fn((config) => Promise.resolve({ data: { ok: true, config } })),
    {
      interceptors: {
        request: {
          use: vi.fn((successHandler) => {
            requestHandlers.push(successHandler);
            return requestHandlers.length - 1;
          }),
        },
        response: {
          use: vi.fn((successHandler, errorHandler) => {
            responseHandlers.push({ successHandler, errorHandler });
            return responseHandlers.length - 1;
          }),
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  );

  return {
    mockGetAccessToken: vi.fn(),
    mockSetAccessToken: vi.fn(),
    mockClearAuth: vi.fn(),
    mockAxiosInstance,
    requestHandlers,
    responseHandlers,
    mockAxios: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((error) => Boolean(error?.isAxiosError)),
      post: vi.fn(),
    },
  };
});

vi.mock("axios", () => ({
  __esModule: true,
  default: testState.mockAxios,
}));

vi.mock("../Store/authStore", () => ({
  default: {
    getState: () => ({
      getAccessToken: testState.mockGetAccessToken,
      setAccessToken: testState.mockSetAccessToken,
      clearAuth: testState.mockClearAuth,
    }),
  },
}));

vi.stubEnv("VITE_BACKEND_API_BASE_URL", "http://localhost:5001/api");

import api from "../Config/axios";

describe("axios client", () => {
  let requestHandler;
  let responseErrorHandler;

  beforeEach(() => {
    testState.mockGetAccessToken.mockReset();
    testState.mockSetAccessToken.mockReset();
    testState.mockClearAuth.mockReset();
    testState.mockAxios.post.mockReset();
    testState.mockAxiosInstance.post.mockReset();
    testState.mockAxiosInstance.get.mockReset();
    testState.mockAxiosInstance.patch.mockReset();
    testState.mockAxiosInstance.delete.mockReset();
    testState.mockAxiosInstance.mockClear();

    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });

    requestHandler = testState.requestHandlers[0];
    responseErrorHandler = testState.responseHandlers[0].errorHandler;
  });

  it("attaches auth headers to protected routes and skips public auth endpoints", () => {
    testState.mockGetAccessToken.mockReturnValue("access-token");

    const protectedConfig = requestHandler({ url: "/user/profile", headers: {} });
    const publicConfig = requestHandler({ url: "/auth/login", headers: {} });

    expect(protectedConfig.headers.Authorization).toBe("Bearer access-token");
    expect(publicConfig.headers.Authorization).toBeUndefined();
  });

  it("refreshes a token once and retries the failed request", async () => {
    testState.mockGetAccessToken.mockReturnValue("stale-token");
    testState.mockAxios.post.mockResolvedValueOnce({
      data: { data: { accessToken: "fresh-token" } },
    });

    const originalRequest = {
      url: "/user/profile",
      headers: { Authorization: "Bearer stale-token" },
    };
    const error = { response: { status: 401 }, config: originalRequest };

    await responseErrorHandler(error);

    expect(testState.mockAxios.post).toHaveBeenCalledWith(
      "http://localhost:5001/api/auth/refresh-token",
      {},
      { withCredentials: true, timeout: 60000 },
    );
    expect(testState.mockSetAccessToken).toHaveBeenCalledWith("fresh-token");
    expect(testState.mockAxiosInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer fresh-token" }),
      }),
    );
  });

  it("clears auth and redirects to home when refresh fails", async () => {
    testState.mockAxios.post.mockRejectedValueOnce(new Error("refresh failed"));

    const originalRequest = {
      url: "/user/profile",
      headers: { Authorization: "Bearer stale-token" },
    };
    const error = { response: { status: 401 }, config: originalRequest };

    await expect(responseErrorHandler(error)).rejects.toThrow("refresh failed");

    expect(testState.mockClearAuth).toHaveBeenCalled();
    expect(window.location.href).toBe("/");
  });
});

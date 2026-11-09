import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../Config/axios", () => ({
  default: apiMock,
}));

import { getProfile, updateName } from "../Services/User/profileService";
import { getPromotionStatus, requestPromotion } from "../Services/User/promotionService";
import { reportReview, reportWebsite, voteReview } from "../Services/Common/reportService";
import { adminLogin } from "../Services/Admin/authService";
import { getMyWebsites, createWebsite } from "../Services/Developer/websiteService";

describe("frontend services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps user profile endpoints correctly", async () => {
    apiMock.get.mockResolvedValue({ ok: true });

    await getProfile();
    await getMyWebsites({ page: 2 });

    expect(apiMock.get).toHaveBeenCalledWith("/user/profile");
    expect(apiMock.get).toHaveBeenCalledWith("/dev/websites/my", { params: { page: 2 } });
  });

  it("maps update and promotion routes correctly", async () => {
    apiMock.patch.mockResolvedValue({ ok: true });
    apiMock.post.mockResolvedValue({ ok: true });

    await updateName("Ada");
    await requestPromotion("leadership");

    expect(apiMock.patch).toHaveBeenCalledWith("/user/profile/name", { name: "Ada" });
    expect(apiMock.post).toHaveBeenCalledWith("/user/promotions/request", { reason: "leadership" });
  });

  it("maps report and admin auth endpoints correctly", async () => {
    apiMock.post.mockResolvedValue({ ok: true });

    await reportReview("review-1", { reason: "spam" });
    await reportWebsite("site-1", { reason: "spam" });
    await voteReview("review-1", "up");
    await adminLogin({ email: "admin@test.com", password: "secret" });

    expect(apiMock.post).toHaveBeenCalledWith("/user/reviews/review-1/report", {
      reason: "spam",
      targetType: "review",
    });
    expect(apiMock.post).toHaveBeenCalledWith("/user/websites/site-1/report", {
      reason: "spam",
      targetType: "website",
    });
    expect(apiMock.post).toHaveBeenCalledWith("/user/reviews/review-1/vote", { voteType: "up" });
    expect(apiMock.post).toHaveBeenCalledWith("/admin/login", { email: "admin@test.com", password: "secret" });
  });

  it("builds multipart developer website payloads", async () => {
    apiMock.post.mockResolvedValue({ ok: true });
    const icon = new File(["icon"], "icon.png", { type: "image/png" });
    const screenshots = [new File(["s1"], "s1.png", { type: "image/png" })];

    await createWebsite(
      {
        name: "Cipher",
        url: "https://cipher.dev",
        category: "Messaging",
        description: "Secure messaging",
        ownerName: "Ada",
        tags: ["chat", "privacy"],
      },
      icon,
      screenshots,
    );

    expect(apiMock.post).toHaveBeenCalledTimes(1);
    const formData = apiMock.post.mock.calls[0][1];
    expect(formData instanceof FormData).toBe(true);
    expect(formData.get("name")).toBe("Cipher");
    expect(formData.get("url")).toBe("https://cipher.dev");
    expect(formData.get("icon")).toBe(icon);
    expect(formData.getAll("tags[]")).toEqual(["chat", "privacy"]);
  });

  it("uses the correct promotion status endpoint", async () => {
    apiMock.get.mockResolvedValue({ ok: true });

    await getPromotionStatus();

    expect(apiMock.get).toHaveBeenCalledWith("/user/promotions/status");
  });
});

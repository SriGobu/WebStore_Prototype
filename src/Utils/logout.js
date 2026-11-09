import { logoutUser } from "../Services/Common/authService";
import useAuthStore from "../Store/authStore";
import ROUTES from "../Constants/routeConstants";
import { USE_MOCK_API } from "../Mock";

export const logout = async (navigate, onError) => {
  try {
    await logoutUser();
    useAuthStore.getState().clearAuth();
    sessionStorage.removeItem("ws-guest");
    navigate(USE_MOCK_API ? ROUTES.MAIN : ROUTES.LOGIN);
  } catch (error) {
    const message =
      typeof error === "string"
        ? error
        : error?.message || "Something went wrong";
    onError?.(message);
  }
};

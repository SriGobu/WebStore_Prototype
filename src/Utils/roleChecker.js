import { getCurrentUserRole } from "../Services/Common/authService";
import useAuthStore from "../Store/authStore";
import { logout } from "./logout";

/**
 * checkRoleFreshness
 *
 * Compares the role stored in authStore against the backend's current
 * value. If they differ (e.g. a promotion was approved while this
 * session was active), forces a logout so the next login picks up the
 * correct role-gated routes.
 *
 * Only meaningful for role "user" — developer/admin roles don't change
 * mid-session in this app's current design, so callers should only
 * invoke this while the stored role is "user".
 */
export async function checkRoleFreshness(navigate, onToast) {
  const { isAuthenticated, user } = useAuthStore.getState();

  if (!isAuthenticated) return;
  if (user?.role !== "user" && user?.role !== "developer") return;

  try {
    const res = await getCurrentUserRole();
    const freshRole = res.data.role;

    if (freshRole && freshRole !== user.role) {
      logout(navigate, () =>
        onToast?.("Your account role has changed. Please log in again."),
      );
    }
  } catch {
    // silent failure — a background check failing shouldn't force
    // logout or interrupt the user; just try again on the next interval
  }
}

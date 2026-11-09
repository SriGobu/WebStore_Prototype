import { Navigate } from "react-router-dom";
import useAuthStore from "../../Store/authStore";
import ROUTES from "../../Constants/routeConstants";
import { USE_MOCK_API } from "../../Mock";

// maps each role to its own "default home" — where a logged-in user
// gets redirected if they hit a route their role isn't allowed on
const ROLE_HOME = {
  user: ROUTES.HOME,
  developer: ROUTES.DEVELOPER_HOME,
  admin: ROUTES.ADMIN_HOME,
};

function roleHome(role) {
  return ROLE_HOME[role] ?? ROUTES.LOGIN;
}

/**
 * ProtectedRoute
 *
 * Guards a route behind authentication, and optionally behind specific
 * roles via the allowedRoles prop.
 *
 * - Not logged in -> redirect to Login
 * - Logged in, but role not in allowedRoles -> redirect to that role's
 *   own home (NOT Login, since they ARE authenticated, just not
 *   authorized for this specific page)
 * - allowedRoles omitted -> any authenticated user/role is allowed
 *   (only checks authentication, same as before)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Navigate to={USE_MOCK_API ? ROUTES.MAIN : ROUTES.LOGIN} replace />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={roleHome(user?.role)} replace />;
  }

  return children;
}

/**
 * PublicOnlyRoute
 *
 * Guards auth pages (Login, Register, etc.) from logged-in users —
 * if already authenticated, redirect to their role's own home instead
 * of showing the login/register form again.
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={roleHome(user?.role)} replace />;
  }

  return children;
}

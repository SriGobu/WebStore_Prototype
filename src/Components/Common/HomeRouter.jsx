// Components/Common/HomeRouter.jsx
import useAuthStore from "../../Store/authStore";
import ROUTES from "../../Constants/routeConstants";
import Home from "../../Pages/User/Home";
import { Navigate } from "react-router-dom";
import { USE_MOCK_API } from "../../Mock";

const ROLE_HOME = {
  developer: ROUTES.DEVELOPER_HOME,
  admin: ROUTES.ADMIN_HOME,
};

export default function HomeRouter() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && ROLE_HOME[user?.role]) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  // Demo mode: visitors who haven't picked a role (or "guest") land on the main page
  if (
    USE_MOCK_API &&
    !isAuthenticated &&
    !sessionStorage.getItem("ws-guest")
  ) {
    return <Navigate to={ROUTES.MAIN} replace />;
  }

  // Guests and regular "user" role both see the public Home page
  return <Home />;
}

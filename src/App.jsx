import "./Styles/App.css";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ROUTES from "./Constants/routeConstants";

import Register from "./Pages/Common/Register";
import Login from "./Pages/Common/Login";
import AdminLogin from "./Pages/Admin/AdminLogin";
import EmailVerify from "./Pages/Common/EmailVerify";
import ForgotPassword from "./Pages/Common/ForgotPassword";
import ResetPassword from "./Pages/Common/ResetPassword";
import NotFoundPage from "./Pages/Common/NotFoundPage";
import MainPage from "./Pages/Common/MainPage";
import WebSection from "./Pages/Common/WebSection";
import PublisherPage from "./Pages/Common/PublisherPage";
import ProtectedRoute, {
  PublicOnlyRoute,
} from "./Components/Common/ProtectedRoute";
import Toast from "./Components/Common/Toast";
import HomeRouter from "./Components/Common/HomeRouter";
import ProfilePage from "./Pages/User/ProfilePage";
import DeveloperPortal from "./Pages/Developer/DeveloperPortal";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import { checkRoleFreshness } from "./Utils/roleChecker";

const CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

function App() {
  const navigate = useNavigate();
  const [resetData, setResetData] = useState({ email: "", otp: "" });
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      checkRoleFreshness(navigate, setToastMessage);
    }, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      <Routes>
        {/* ── Main page: pick a role (User / Developer / Admin) ── */}
        <Route path={ROUTES.MAIN} element={<MainPage />} />

        {/* ── User routes ── */}
        <Route path={ROUTES.HOME} element={<HomeRouter />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ── Auth routes (public only) ── */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path={ROUTES.REGISTER}
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        <Route
          path={ROUTES.EMAIL_VERIFY}
          element={
            <PublicOnlyRoute>
              <EmailVerify />
            </PublicOnlyRoute>
          }
        />

        <Route
          path={ROUTES.FORGOT_PASSWORD}
          element={
            <PublicOnlyRoute>
              <ForgotPassword setResetData={setResetData} />
            </PublicOnlyRoute>
          }
        />

        <Route
          path={ROUTES.RESET_PASSWORD}
          element={
            <PublicOnlyRoute>
              <ResetPassword resetData={resetData} />
            </PublicOnlyRoute>
          }
        />

        {/* ── Admin login — separate public route ── */}
        <Route
          path={ROUTES.ADMIN_LOGIN}
          element={
            <PublicOnlyRoute>
              <AdminLogin />
            </PublicOnlyRoute>
          }
        />

        {/* ── Shared: all authenticated roles ── */}
        <Route path="/website/:id" element={<WebSection />} />

        <Route path="/developer/:ownerName" element={<PublisherPage />} />

        {/* ── Developer portal ── */}
        <Route
          path={ROUTES.DEVELOPER_HOME}
          element={
            <ProtectedRoute allowedRoles={["developer"]}>
              <DeveloperPortal />
            </ProtectedRoute>
          }
        />

        {/* ── Admin dashboard ── */}
        <Route
          path={ROUTES.ADMIN_HOME}
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;

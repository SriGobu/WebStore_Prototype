import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { validateFields } from "../../Utils/formValidator";
import Toast from "../../Components/Common/Toast";
import ROUTES from "../../Constants/routeConstants";
import { resetPassword } from "../../Services/Common/authService";

function ResetPassword({ resetData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const flowData = location.state?.email ? location.state : resetData;

  useEffect(() => {
    if (!flowData?.email || !flowData?.otp) {
      navigate(ROUTES.FORGOT_PASSWORD, { replace: true });
    }
  }, [flowData?.email, flowData?.otp, navigate]);

  const handleReset = async () => {
    const { isValid, errors } = validateFields({ newPassword });
    if (!isValid) {
      setToast(Object.values(errors)[0]);
      return;
    }
    try {
      setLoading(true);
      await resetPassword({
        email: flowData.email,
        otp: flowData.otp,
        newPassword,
      });
      setToast("Password reset successfully");
      setTimeout(() => navigate(ROUTES.LOGIN), 1500);
    } catch (err) {
      setToast(
        typeof err === "string" ? err : err?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center w-full min-h-screen"
      style={{
        background: "linear-gradient(135deg, #E8DCC8 0%, #D4C4B0 100%)",
      }}
    >
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-8 py-10 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-[#2d2d2d] mb-2">
          Reset Password
        </h2>
        <p className="text-sm text-[#4a4a4a] mb-8">
          Resetting for:{" "}
          <span className="text-[#E07856] font-semibold">
            {flowData?.email}
          </span>
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
            New Password
          </label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-[#D4C4B0] rounded-md text-sm bg-[#F9F6F3] text-[#2d2d2d] placeholder-[#A8937B] focus:outline-none focus:border-[#B8956A] focus:bg-white focus:ring-2 focus:ring-[#B8956A]/10 transition-all"
          />
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full py-3 mb-6 bg-[#B8956A] text-white text-sm font-semibold tracking-wide rounded-md uppercase hover:bg-[#9d7e54] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <div className="text-center">
          <span
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className="text-xs text-[#E07856] font-semibold cursor-pointer hover:text-[#D45A3A] hover:underline transition-colors"
          >
            ← Back
          </span>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

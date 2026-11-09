import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOTP, resendOTP } from "../../Services/Common/authService";
import OtpInput from "../../Components/Common/OtpInput";
import Toast from "../../Components/Common/Toast";
import ROUTES from "../../Constants/routeConstants";

function EmailVerify() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [email] = useState(() => {
    return sessionStorage.getItem("verifyEmail") || "";
  });
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate(ROUTES.REGISTER);
    }
  });

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setToast("Please enter a 6-digit code");
      return;
    }
    try {
      setLoading(true);
      await verifyOTP({ email, otp });
      sessionStorage.removeItem("verifyEmail");
      navigate(ROUTES.LOGIN);
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Something went wrong";
      setToast(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP({ email });
      setOtp("");
      setToast("OTP resent successfully");
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Failed to resend OTP";
      setToast(message);
    }
  };

  return (
    <div
      className="flex items-center justify-center w-full min-h-screen"
      style={{
        background: "linear-gradient(135deg, #E8DCC8 0%, #D4C4B0 100%)",
      }}
    >
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-8 py-10 w-full max-w-sm text-center flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[#2d2d2d] mb-4">
          Check your email
        </h2>
        <p className="text-sm text-[#4a4a4a] mb-2">
          Enter the verification code sent to
        </p>
        <p className="text-[#E07856] font-semibold mb-8">{email}</p>

        {/* 6 individual OTP boxes */}
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full py-3 mb-5 bg-[#B8956A] text-white text-sm font-semibold tracking-wide rounded-md hover:bg-[#9d7e54] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        {/* Resend */}
        <div className="flex justify-center gap-1 text-xs text-[#4a4a4a]">
          <span>Didn't get your code?</span>
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-[#E07856] font-semibold hover:text-[#D45A3A] hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerify;

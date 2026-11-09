// Components/Common/ChangePasswordFlow.jsx
import { useState } from "react";
import { validateFields } from "../../Utils/formValidator";
import Toast from "./Toast";
import OtpInput from "./OtpInput";
import {
  requestPasswordReset,
  resendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
} from "../../Services/Common/authService";

/**
 * Self-contained email -> OTP -> new password flow.
 * Owns all its own state, so it never depends on location.state / lifted app state
 * and never breaks on refresh (there's only ever one mounted step, no route change).
 *
 * mode="standalone"  -> full-screen gradient card (used by the public /forgot-password route)
 * mode="embedded"    -> plain panel, fits inside a settings modal/section
 *
 * initialEmail / requireEmailStep let a logged-in caller (Settings) skip step 1
 * and go straight to "send OTP to my account email".
 */
export default function ChangePasswordFlow({
  mode = "standalone",
  initialEmail = "",
  requireEmailStep = true,
  onDone, // called after password is successfully reset
  onCancel, // called on "Back" / "Change email" / close
  onToast,
}) {
  const [step, setStep] = useState(requireEmailStep ? 1 : 2);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [verifiedOtp, setVerifiedOtp] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoSent, setAutoSent] = useState(false);

  const notify = onToast ?? setToast;

  async function sendOtp(targetEmail) {
    try {
      setLoading(true);
      await requestPasswordReset({ email: targetEmail });
      setStep(2);
      notify("OTP sent to your email");
    } catch (err) {
      notify(
        typeof err === "string" ? err : err?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  // Embedded usage: fire the OTP email automatically once, instead of showing an email input.
  if (!requireEmailStep && !autoSent && email) {
    setAutoSent(true);
    sendOtp(email);
  }

  async function handleSendOTP() {
    const { isValid, errors } = validateFields({ email });
    if (!isValid) {
      notify(Object.values(errors)[0]);
      return;
    }
    await sendOtp(email);
  }

  async function handleVerifyOTP() {
    if (!otp || otp.length !== 6) {
      notify("Please enter the 6-digit OTP");
      return;
    }
    try {
      setLoading(true);
      await verifyForgotPasswordOTP({ email, otp });
      setVerifiedOtp(otp);
      setStep(3);
    } catch (err) {
      notify(
        typeof err === "string" ? err : err?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendForgotPasswordOTP({ email });
      setOtp("");
      setToast("OTP sent successfully");
    } catch (err) {
      setToast(
        typeof err === "string" ? err : err?.message || "Something went wrong",
      );
    }
  }

  async function handleReset() {
    const { isValid, errors } = validateFields({ password: newPassword });
    if (!isValid) {
      notify(Object.values(errors)[0]);
      return;
    }
    try {
      setLoading(true);
      await resetPassword({ email, otp: verifiedOtp, newPassword });
      notify("Password reset successfully");
      onDone?.();
    } catch (err) {
      notify(
        typeof err === "string" ? err : err?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 border border-[#D4C4B0] rounded-md text-sm bg-[#F9F6F3] text-[#2d2d2d] placeholder-[#A8937B] focus:outline-none focus:border-[#B8956A] focus:bg-white focus:ring-2 focus:ring-[#B8956A]/10 transition-all";
  const btnClass =
    "w-full py-3 bg-[#B8956A] text-white text-sm font-semibold tracking-wide rounded-md uppercase hover:bg-[#9d7e54] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all";

  const card = (
    <div
      className={
        mode === "standalone"
          ? "bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-8 py-10 w-full max-w-sm"
          : "w-full"
      }
    >
      {!onToast && <Toast message={toast} onClose={() => setToast(null)} />}

      <h2 className="text-2xl font-bold text-[#2d2d2d] mb-2">
        {step === 3 ? "Reset Password" : "Forgot Password"}
      </h2>
      <p className="text-sm text-[#4a4a4a] mb-8">
        {step === 1 && "Enter your email to receive an OTP"}
        {step === 2 && `OTP sent to ${email}`}
        {step === 3 && (
          <>
            Resetting for:{" "}
            <span className="text-[#E07856] font-semibold">{email}</span>
          </>
        )}
      </p>

      {step === 1 && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className={btnClass}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4a4a4a] mb-4">
              Enter OTP
            </label>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={loading}
              autoFocus
            />
          </div>
          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            className={`${btnClass} mb-5`}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="flex justify-between text-xs">
            <div className="flex gap-1 text-[#4a4a4a]">
              <span>Didn't receive?</span>
              <span
                onClick={handleResend}
                className="text-[#E07856] font-semibold cursor-pointer hover:underline"
              >
                Resend OTP
              </span>
            </div>
            {requireEmailStep && (
              <span
                onClick={() => {
                  setStep(1);
                  setOtp("");
                }}
                className="text-[#E07856] font-semibold cursor-pointer hover:underline"
              >
                Change Email
              </span>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleReset}
            disabled={loading}
            className={`${btnClass} mb-6`}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      )}

      {onCancel && (
        <div className="mt-6 text-center">
          <span
            onClick={onCancel}
            className="text-xs text-[#E07856] font-semibold cursor-pointer hover:text-[#D45A3A] hover:underline transition-colors"
          >
            {mode === "standalone" ? "← Back to Login" : "Cancel"}
          </span>
        </div>
      )}
    </div>
  );

  if (mode === "embedded") return card;

  return (
    <div
      className="flex items-center justify-center w-full min-h-screen"
      style={{
        background: "linear-gradient(135deg, #E8DCC8 0%, #D4C4B0 100%)",
      }}
    >
      {card}
    </div>
  );
}

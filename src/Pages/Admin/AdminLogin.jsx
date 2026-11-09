import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../../Services/Admin/authService";
import useAuthStore from "../../Store/authStore";
import ROUTES from "../../Constants/routeConstants";
import Toast from "../../Components/Common/Toast";
import { USE_MOCK_API } from "../../Mock";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
    secretKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setToastMessage("");
  }

  async function handleLogin() {
    if (!form.email.trim() || !form.password.trim() || !form.secretKey.trim()) {
      setToastMessage("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(form);
      if (!res?.data?.accessToken) {
        throw new Error("Invalid login response: missing access token");
      }
      if (!res?.data?.user) {
        throw new Error("Invalid login response: missing user data");
      }
      setAuth(res.data.accessToken, res.data.user);
      navigate(ROUTES.ADMIN_HOME, { replace: true });
    } catch (err) {
      setToastMessage(
        err.response?.data?.message ||
          err.message ||
          "Invalid credentials or secret key",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLogin();
  }

  const inputCls =
    "w-full bg-[#f5efe6] border border-[#d1c9bf] rounded-[10px] px-4 h-[46px] text-sm text-[#111] placeholder:text-[#767676] focus:outline-none focus:border-[#c4956a] transition-colors";

  return (
    <div className="bg-[#f5efe6] min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#fafafa] rounded-2xl shadow-[0px_8px_16px_rgba(0,0,0,0.12)] w-full max-w-[380px] p-8 flex flex-col gap-5">
        {/* Header */}
        <div className="text-center">
          <div className="size-12 rounded-xl bg-[#c4956a] flex items-center justify-center mx-auto mb-3">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="font-semibold text-[#111] text-lg">Admin Portal</h1>
          <p className="text-[#767676] text-xs mt-0.5">
            Sign in with your admin credentials
          </p>
        </div>

        {/* Toast */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage("")} />
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#333]">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your email"
            className={inputCls}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#333]">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your password"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767676] hover:text-[#c4956a] transition-colors"
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Secret Key */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-[#333]">
            Secret Key
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={form.secretKey}
              onChange={(e) => set("secretKey", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter admin secret key"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767676] hover:text-[#c4956a] transition-colors"
            >
              {showSecret ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#999]">
            Contact your system administrator for the secret key.
          </p>
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#c4956a] text-white rounded-[10px] py-3 font-semibold text-[15px] hover:bg-[#b08560] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            "Login"
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#bbb]">
          Not an admin?{" "}
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="text-[#c4956a] hover:underline font-medium"
          >
            Go to user login
          </button>
        </p>

        {USE_MOCK_API && (
          <p className="text-center text-[11px] text-[#bbb] -mt-3">
            <button
              onClick={() => navigate(ROUTES.MAIN)}
              className="text-[#c4956a] hover:underline font-medium"
            >
              ← Back to main page
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

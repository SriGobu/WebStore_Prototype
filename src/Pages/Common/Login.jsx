import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginUser } from "../../Services/Common/authService";
import { validateFields } from "../../Utils/formValidator";
import useAuthStore from "../../Store/authStore";
import Toast from "../../Components/Common/Toast";
import ROUTES from "../../Constants/routeConstants";
import { USE_MOCK_API } from "../../Mock";

function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [toast, setToast] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    const { isValid, errors } = validateFields({
      email,
      password,
    });

    setErrors(errors);

    if (!isValid) {
      setToast(Object.values(errors)[0]);
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({ email, password });

      if (!response?.data?.accessToken)
        throw new Error("Invalid login response: missing access token");

      if (!response?.data?.user)
        throw new Error("Invalid login response: missing user data");

      setAuth(response.data.accessToken, response.data.user);

      navigate(ROUTES.HOME);
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Something went wrong";

      setToast(message);
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
        {/* Tab Bar */}
        <div className="flex gap-4 mb-8 justify-between">
          <button className="px-4 py-2 text-xs font-semibold tracking-wide rounded bg-[#B8956A] text-[#2d2d2d] uppercase">
            Login
          </button>
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="px-4 py-2 text-xs font-semibold tracking-wide rounded text-[#C9A876] bg-transparent hover:text-[#9d7e54] uppercase transition-colors"
          >
            Register
          </button>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              const value = e.target.value;
              setEmail(value);

              const { errors } = validateFields({ email: value, password });
              setErrors((prev) => ({ ...prev, email: errors.email || "" }));
            }}
            className={`w-full px-4 py-3 border rounded-md text-sm bg-[#F9F6F3] text-[#2d2d2d] placeholder-[#A8937B] focus:outline-none focus:bg-white focus:ring-2 transition-all ${
              errors.email
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-[#D4C4B0] focus:border-[#B8956A] focus:ring-[#B8956A]/10"
            }`}
          />

          <p
            className={`mt-1 text-xs ${
              errors.email ? "text-red-500" : "text-[#767676]"
            }`}
          >
            {errors.email || "Enter a valid email address"}
          </p>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              const value = e.target.value;
              setPassword(value);

              const { errors } = validateFields({ email, password: value });
              setErrors((prev) => ({
                ...prev,
                password: errors.password || "",
              }));
            }}
            className={`w-full px-4 py-3 border rounded-md text-sm bg-[#F9F6F3] text-[#2d2d2d] placeholder-[#A8937B] focus:outline-none focus:bg-white focus:ring-2 transition-all ${
              errors.password
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-[#D4C4B0] focus:border-[#B8956A] focus:ring-[#B8956A]/10"
            }`}
          />

          <p
            className={`mt-1 text-xs ${
              errors.password ? "text-red-500" : "text-[#767676]"
            }`}
          >
            {errors.password ||
              "8-32 characters, uppercase, lowercase, number & special character"}
          </p>
        </div>

        {/* Forgot Password */}
        <div className="text-right mb-6">
          <span
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className="text-xs text-[#E07856] font-medium cursor-pointer hover:text-[#D45A3A] hover:underline transition-colors"
          >
            Forgot Password?
          </span>
        </div>

        {/* Button */}
        <button
          onClick={() => {
            handleLogin();
          }}
          disabled={loading}
          className="w-full py-3 mb-6 bg-[#B8956A] text-white text-sm font-semibold tracking-wide rounded-md uppercase hover:bg-[#9d7e54] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <div className="flex justify-center gap-1 text-xs text-[#4a4a4a]">
          <span>Doesn't have an account?</span>
          <span
            onClick={() => navigate(ROUTES.REGISTER)}
            className="text-[#E07856] font-semibold uppercase cursor-pointer hover:text-[#D45A3A] hover:underline transition-colors"
          >
            Register
          </span>
        </div>

        {USE_MOCK_API && (
          <p className="text-center text-xs mt-4">
            <span
              onClick={() => navigate(ROUTES.MAIN)}
              className="text-[#767676] cursor-pointer hover:text-[#c4956a] hover:underline transition-colors"
            >
              ← Back to main page
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;

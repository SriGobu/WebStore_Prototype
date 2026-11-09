import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../Components/Common/Toast";
import LegalModal from "../../Components/Common/LegalModal";
import { LEGAL_CONTENT } from "../../Constants/legalContent";
import { validateFields } from "../../Utils/formValidator";
import { registerUser } from "../../Services/Common/authService";
import ROUTES from "../../Constants/routeConstants";

function Register() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [openDoc, setOpenDoc] = useState(null); // null | 'terms' | 'privacy'
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleRegister = async () => {
    const { isValid, errors } = validateFields({ name, email, password });
    if (!isValid) {
      setToast(Object.values(errors)[0]);
      return;
    }
    if (!agreedToTerms) {
      setToast(
        "You must accept the Terms of Service and Privacy Policy to register",
      );
      return;
    }
    try {
      setLoading(true);
      const response = await registerUser({
        name,
        email,
        password,
        agreedToTerms,
      });
      if (response) {
        sessionStorage.setItem("verifyEmail", email);
        navigate(ROUTES.EMAIL_VERIFY);
      }
    } catch (error) {
      setToast(
        typeof error === "string"
          ? error
          : error?.message || "Something went wrong",
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
        {/* Tab Bar */}
        <div className="flex gap-4 mb-8 justify-between">
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="px-4 py-2 text-xs font-semibold tracking-wide rounded text-[#C9A876] bg-transparent hover:text-[#9d7e54] uppercase transition-colors"
          >
            Login
          </button>
          <button className="px-4 py-2 text-xs font-semibold tracking-wide rounded bg-[#B8956A] text-[#2d2d2d] uppercase">
            Register
          </button>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
            Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              setName(value);

              const { errors } = validateFields({
                name: value,
                email,
                password,
              });

              setErrors((prev) => ({
                ...prev,
                name: errors.name || "",
              }));
            }}
            className={`w-full px-4 py-3 border rounded-md text-sm bg-[#F9F6F3] text-[#2d2d2d] placeholder-[#A8937B] focus:outline-none focus:bg-white focus:ring-2 transition-all ${
              errors.name
                ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                : "border-[#D4C4B0] focus:border-[#B8956A] focus:ring-[#B8956A]/10"
            }`}
          />

          <p
            className={`mt-1 text-xs ${
              errors.name ? "text-red-500" : "text-[#767676]"
            }`}
          >
            {errors.name || "3-50 characters"}
          </p>
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

              const { errors } = validateFields({
                name,
                email: value,
                password,
              });

              setErrors((prev) => ({
                ...prev,
                email: errors.email || "",
              }));
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

              const { errors } = validateFields({
                name,
                email,
                password: value,
              });

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

        {/* Terms & Privacy agreement */}
        <div className="mb-6">
          <label className="flex items-start gap-2 text-xs text-[#4a4a4a] cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 accent-[#B8956A]"
            />
            <span>
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setOpenDoc("terms")}
                className="text-[#E07856] font-semibold hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setOpenDoc("privacy")}
                className="text-[#E07856] font-semibold hover:underline"
              >
                Privacy Policy
              </button>
            </span>
          </label>
        </div>

        {/* Button */}
        <button
          onClick={handleRegister}
          disabled={loading || !agreedToTerms}
          className="w-full py-3 mb-6 bg-[#B8956A] text-white text-sm font-semibold tracking-wide rounded-md uppercase hover:bg-[#9d7e54] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* Footer */}
        <div className="flex justify-center gap-1 text-xs text-[#4a4a4a]">
          <span>Already have an account?</span>
          <span
            onClick={() => navigate(ROUTES.LOGIN)}
            className="text-[#E07856] font-semibold uppercase cursor-pointer hover:text-[#D45A3A] hover:underline transition-colors"
          >
            Login
          </span>
        </div>
      </div>

      {openDoc && (
        <LegalModal
          content={LEGAL_CONTENT[openDoc]}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </div>
  );
}

export default Register;

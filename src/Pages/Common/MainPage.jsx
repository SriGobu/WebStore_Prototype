import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { User, Code, ShieldCheck, ArrowRight, RotateCcw } from "lucide-react";
import { loginUser } from "../../Services/Common/authService";
import { adminLogin } from "../../Services/Admin/authService";
import useAuthStore from "../../Store/authStore";
import ROUTES from "../../Constants/routeConstants";
import Toast from "../../Components/Common/Toast";
import { DEMO_ACCOUNTS, resetDb } from "../../Mock";

const GUEST_KEY = "ws-guest";

const ROLES = [
  {
    key: "user",
    title: "User",
    icon: User,
    tagline: "Discover, review and save websites",
    pages: [
      "Home — explore & filter websites",
      "Website details, reviews & replies",
      "Profile: overview, settings, activity",
      "Notifications & become a developer",
      "Support tickets & legal",
    ],
    home: ROUTES.HOME,
    altLabel: "Open user login form",
    altRoute: ROUTES.LOGIN,
  },
  {
    key: "developer",
    title: "Developer",
    icon: Code,
    tagline: "Publish and manage your websites",
    pages: [
      "Dashboard — visitors & ratings",
      "My Websites — create, edit, reviews",
      "Browse Websites & write reviews",
      "Audit & Log",
      "Contact support, profile & settings",
    ],
    home: ROUTES.DEVELOPER_HOME,
    altLabel: "Open login form",
    altRoute: ROUTES.LOGIN,
  },
  {
    key: "admin",
    title: "Admin",
    icon: ShieldCheck,
    tagline: "Moderate and run the platform",
    pages: [
      "Dashboard — platform metrics",
      "Browse Websites, Users & Developers",
      "Website Approval & Promotions",
      "Reviews & Replies, Reports, Tickets",
      "Audit Log & profile",
    ],
    home: ROUTES.ADMIN_HOME,
    altLabel: "Open admin login form",
    altRoute: ROUTES.ADMIN_LOGIN,
  },
];

export default function MainPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [loadingRole, setLoadingRole] = useState(null);
  const [toast, setToast] = useState("");

  async function loginAs(role) {
    setLoadingRole(role);
    try {
      clearAuth();
      const creds = DEMO_ACCOUNTS[role];
      const res =
        role === "admin"
          ? await adminLogin(creds)
          : await loginUser({ email: creds.email, password: creds.password });

      if (!res?.data?.accessToken || !res?.data?.user)
        throw new Error("Invalid login response");

      setAuth(res.data.accessToken, res.data.user);
      navigate(ROLES.find((r) => r.key === role).home, { replace: true });
    } catch (err) {
      setToast(err?.message || "Something went wrong");
    } finally {
      setLoadingRole(null);
    }
  }

  function browseAsGuest() {
    clearAuth();
    sessionStorage.setItem(GUEST_KEY, "1");
    navigate(ROUTES.HOME);
  }

  function handleReset() {
    resetDb();
    clearAuth();
    sessionStorage.removeItem(GUEST_KEY);
    setToast("Demo data has been reset");
  }

  return (
    <div className="bg-[#f5efe6] min-h-screen w-full flex flex-col">
      <Helmet>
        <title>WebStore — Choose how to explore</title>
      </Helmet>
      <Toast message={toast} onClose={() => setToast("")} />

      {/* Top bar */}
      <header className="bg-[#fafafa] border-b border-[#e0d9d0] w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.svg"
              alt="WebStore logo"
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg object-cover bg-white"
            />
            <span className="font-semibold text-[#c4956a] text-base sm:text-lg truncate">
              WebStore
            </span>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#f5efe6] border border-[#e0d9d0] text-[#767676] shrink-0">
            Demo mode · mock data
          </span>
        </div>
      </header>

      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Intro */}
        <div className="text-center mb-10">
          <h1 className="font-semibold text-[#111] text-3xl mb-3">
            Welcome to WebStore
          </h1>
          <p className="text-[#767676] text-sm max-w-xl mx-auto">
            Pick a role to sign in instantly with a demo account and explore
            every page. All data on this site is mock data stored in your
            browser.
          </p>
          {isAuthenticated && (
            <p className="mt-4 text-xs text-[#767676]">
              Currently signed in as{" "}
              <span className="font-semibold text-[#111]">{user?.name}</span> (
              <span className="capitalize">{user?.role}</span>).{" "}
              <button
                onClick={() => clearAuth()}
                className="text-[#c4956a] font-semibold hover:underline"
              >
                Sign out
              </button>
            </p>
          )}
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {ROLES.map(
            ({ key, title, icon: Icon, tagline, pages, altLabel, altRoute }) => {
              const creds = DEMO_ACCOUNTS[key];
              const isAdmin = key === "admin";
              const busy = loadingRole === key;
              return (
                <div
                  key={key}
                  className="bg-[#fafafa] rounded-2xl border border-[#e8ddd2] shadow-md p-6 flex flex-col"
                >
                  <div
                    className={`size-12 rounded-xl flex items-center justify-center mb-4 ${
                      isAdmin ? "bg-[#334155]" : "bg-[#c4956a]"
                    }`}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <h2 className="font-semibold text-[#111] text-lg">
                    {title}
                  </h2>
                  <p className="text-[#767676] text-sm mb-4">{tagline}</p>

                  <ul className="space-y-1.5 mb-5 flex-1">
                    {pages.map((p) => (
                      <li
                        key={p}
                        className="text-[13px] text-[#333] font-light flex gap-2"
                      >
                        <span className="text-[#c4956a]">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-3 mb-4 text-[12px] text-[#555] space-y-0.5 break-all">
                    <p>
                      <span className="text-[#767676]">Email:</span>{" "}
                      {creds.email}
                    </p>
                    <p>
                      <span className="text-[#767676]">Password:</span>{" "}
                      {creds.password}
                    </p>
                    {creds.secretKey && (
                      <p>
                        <span className="text-[#767676]">Secret key:</span>{" "}
                        {creds.secretKey}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => loginAs(key)}
                    disabled={!!loadingRole}
                    className={`w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      isAdmin
                        ? "bg-[#334155] hover:bg-[#1e293b]"
                        : "bg-[#c4956a] hover:bg-[#b08560]"
                    }`}
                  >
                    {busy ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Continue as {title}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(altRoute)}
                    className="mt-3 text-xs text-[#767676] hover:text-[#c4956a] hover:underline transition-colors"
                  >
                    {altLabel}
                  </button>
                </div>
              );
            },
          )}
        </div>

        {/* Secondary actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={browseAsGuest}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#f5efe6] border border-[#e0d9d0] text-[#111] hover:bg-[#e8dfd4] transition-colors"
          >
            Browse as guest
          </button>
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#f5efe6] border border-[#e0d9d0] text-[#111] hover:bg-[#e8dfd4] transition-colors"
          >
            Create an account
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#767676] hover:text-[#c4956a] transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            Reset demo data
          </button>
        </div>
      </main>
    </div>
  );
}

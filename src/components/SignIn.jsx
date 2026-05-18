import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material";
import { startTokenRefreshScheduler } from "../utils/api";
import {
  applyTutorOnboardingStorageForAuthenticatedUser,
  migrateUnscopedTutorOnboardingForCurrentUser,
} from "../utils/onboarding";
import { mergeProspectStatusIntoUser } from "../utils/tutorProspectStatus";
//signin
const EyeIcon = (props) => (
  <svg
    {...props}
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg
    {...props}
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

const CheckIcon = (props) => (
  <svg
    {...props}
    className="w-3.5 h-3.5"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const SignIn = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const COLOR_STUDENT_TAB_ACTIVE = "#b18e47";
  const COLOR_BUTTON_BLUE_GRADIENT = {
    start: "#4898e3",
    end: "#19619b",
  };
  const COLOR_RIGHT_SIDE_GRADIENT = {
    start: "#366d9c",
    end: "#47a3e7",
  };
  const COLOR_LINK_BLUE = "#3b82f6";

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const role = activeTab === "tutor" ? "tutor" : "student";
    window.location.href = `${apiUrl}/api/v1/auth/google?role=${encodeURIComponent(
      role
    )}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setAlert({
        open: true,
        message: "Please enter both email and password",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        applyTutorOnboardingStorageForAuthenticatedUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // Start automatic token refresh scheduler
        startTokenRefreshScheduler();

        const extra =
          data.additionalLoginNotice === true
            ? " You already have a previous sign-in; multiple devices are allowed. If this was not you, change your password or contact support."
            : "";
        setAlert({
          open: true,
          message: `Login successful! Redirecting...${extra}`,
          severity: data.additionalLoginNotice === true ? "info" : "success",
        });

        // Role-based navigation
        const userRole = data.user.role;

        if (userRole === "student") {
          setTimeout(() => navigate("/dashboard"), 1500);
        } else if (userRole === "admin") {
          setTimeout(() => navigate("/admin-dashboard"), 1500);
        } else if (userRole === "tutor") {
          // Check onboarding status for tutors
          try {
            const statusResponse = await fetch(
              `${apiUrl}/api/v1/onboarding/status/${data.user.id}`,
              {
                headers: {
                  Authorization: `Bearer ${data.accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            const statusData = await statusResponse.json();
            console.log("Onboarding status data:", statusData);

            if (statusResponse.ok) {
              const status = statusData.status || statusData.data?.status;
              const publishedStatus =
                statusData.publishedStatus || statusData.data?.publishedStatus;
              const hasPendingProfileUpdate = Boolean(
                statusData.hasPendingProfileUpdate ??
                  statusData.data?.hasPendingProfileUpdate,
              );

              const updatedUser = mergeProspectStatusIntoUser(
                { ...data.user, paymentOnBoarded: data.user.paymentOnBoarded },
                statusData,
              );
              localStorage.setItem("user", JSON.stringify(updatedUser));

              const paymentOnBoarded = data.user.paymentOnBoarded;
              const isApprovedTutor =
                status === "active" ||
                publishedStatus === "active" ||
                hasPendingProfileUpdate;

              console.log("Status:", status);
              console.log("PaymentOnBoarded:", paymentOnBoarded);

              if (isApprovedTutor) {
                // Check if payment onboarding is complete
                if (paymentOnBoarded === false) {
                  console.log("Redirecting to payment setup");
                  setTimeout(() => navigate("/create-profile"), 1500);
                } else {
                  console.log("Redirecting to tutor dashboard");
                  setTimeout(() => navigate("/tutor-dashboard"), 1500);
                }
              } else if (status === "awaiting_interview") {
                console.log("Redirecting to interviews page");
                setTimeout(() => navigate("/interviews"), 1500);
              } else if (status === "pending") {
                console.log("Redirecting to interviews");
                setTimeout(() => navigate("/interviews"), 1500);
              } else {
                setTimeout(() => navigate("/create-profile"), 1500);
              }
            } else {
              // If status check fails, default to create-profile
              setTimeout(() => navigate("/create-profile"), 1500);
            }
          } catch (statusError) {
            console.error("Error checking onboarding status:", statusError);
            setTimeout(() => navigate("/create-profile"), 1500);
          }
        } else {
          // Default fallback
          setTimeout(() => navigate("/dashboard"), 1500);
        }
        migrateUnscopedTutorOnboardingForCurrentUser();
      } else {
        setAlert({
          open: true,
          message:
            data.message || "Login failed. Please check your credentials.",
          severity: "error",
        });
      }
    } catch (error) {
      setAlert({
        open: true,
        message:
          error.message || "Network error. Please check your connection.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex antialiased">
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 overflow-y-auto">
        <div className="w-full max-w-sm my-8 md:my-0">
          <div className="flex justify-center md:mt-20 mb-2">
            <Link to="/">
              <img
                src="/images/logo.png.png"
                alt="Tutor Scene Logo"
                className="h-[115px] w-auto cursor-pointer"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
            </Link>
            <div className="text-center" style={{ display: "none" }}>
              <div className="w-16 h-16 bg-brand-dark-blue rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-brand-gold">
                <svg
                  className="w-10 h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-dark-blue">TUTOR</h1>
              <h2 className="text-2xl font-bold text-brand-medium-blue">
                SCENE
              </h2>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          </div>

          <div className="flex rounded-md overflow-hidden mb-6 border border-[#b18e47]">
            <button
              onClick={() => setActiveTab("student")}
              style={{
                backgroundColor:
                  activeTab === "student" ? COLOR_STUDENT_TAB_ACTIVE : "white",
              }}
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors border-r border-[#b18e47] 
                ${
                  activeTab === "student"
                    ? "text-white"
                    : "text-gray-700 bg-white hover:bg-gray-50"
                }`}
            >
              <span className="block leading-tight">Learner</span>
              <span className="block text-[11px] font-normal opacity-95">
                Guardian
              </span>
            </button>
            <button
              onClick={() => setActiveTab("tutor")}
              style={{
                backgroundColor:
                  activeTab === "tutor" ? COLOR_STUDENT_TAB_ACTIVE : "white",
              }}
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors 
                ${
                  activeTab === "tutor"
                    ? "text-white"
                    : "text-gray-700 bg-white hover:bg-gray-50"
                }`}
            >
              Tutor
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  // Match border color, rounded shape, and remove focus ring for a tighter match
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm pr-10 text-gray-600"
                  style={{
                    fontFamily: showPassword ? "inherit" : "text-security-disc",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="text-right mb-5">
              <a
                href="#forgot"
                style={{ color: COLOR_LINK_BLUE }}
                className="text-sm hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-shadow mb-4 text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `linear-gradient(to right, ${COLOR_BUTTON_BLUE_GRADIENT.start}, ${COLOR_BUTTON_BLUE_GRADIENT.end})`,
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account yet?{" "}
              <Link
                to="/signup"
                className="text-brand-medium-blue hover:text-brand-dark-blue hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-xs font-medium text-gray-700">
                  Sign in with Google
                </span>
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img
                  src="/images/signup_with_apple.svg"
                  alt="Apple"
                  className="w-5 h-5"
                />

                <span className="text-xs font-medium text-gray-700">
                  Sign in with Apple
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="hidden md:flex md:w-1/2 items-start justify-center relative overflow-hidden p-12"
        style={{
          background: `linear-gradient(180deg, ${COLOR_RIGHT_SIDE_GRADIENT.start} 0%, ${COLOR_RIGHT_SIDE_GRADIENT.end} 100%)`,
        }}
      >
        <img
          src="/images/e961e2fb611e53239ecfde7cb7d50f02cf801a6a.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${COLOR_RIGHT_SIDE_GRADIENT.start}cc 0%, ${COLOR_RIGHT_SIDE_GRADIENT.end}cc 100%)`,
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-end pb-8 text-center text-white">
          <div className="flex-grow" />

          <h2 className="mb-1 text-4xl font-bold leading-tight">
            Welcome Back to
          </h2>
          <h3 className="mb-4 text-4xl font-bold">Tutor Scene</h3>

          <p className="mb-10 max-w-md mx-auto px-2 text-lg font-normal leading-relaxed">
            Sign in to manage bookings, connect, and continue your journey
          </p>

          <div className="mt-auto">
            <div className="flex justify-center gap-3 text-sm flex-wrap">
              {["Verified Tutors", "Flexible Schedule", "Secure Payments"].map(
                (feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  >
                    <CheckIcon />
                    <span className="font-medium text-sm">{feature}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        open={alert.open}
        autoHideDuration={alert.severity === "info" ? 10000 : 6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SignIn;

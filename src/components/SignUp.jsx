import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material";

// Utility for Eye/Eye-Slash icons (Tailwind Heroicons v1.0 compatible)
const EyeIcon = (props) => (
  <svg
    {...props}
    className="w-5 h-5"
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
    className="w-5 h-5"
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

// Utility for Checkmark icon
const CheckIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const SignUp = () => {
  const navigate = useNavigate();

  // --- State Hooks ---
  const [activeTab, setActiveTab] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    referralCode: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [selectedGender, setSelectedGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.password.trim() !== "" &&
      formData.confirmPassword.trim() !== "" &&
      formData.password === formData.confirmPassword &&
      (activeTab !== "tutor" || selectedGender.trim() !== "") &&
      formData.agreeTerms
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.agreeTerms) {
      setAlert({
        open: true,
        message: "Please agree to the Terms and Privacy Policies",
        severity: "error",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      return;
    }

    if (activeTab === "tutor" && !selectedGender.trim()) {
      setAlert({
        open: true,
        message: "Please select a gender identity.",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: activeTab,
        referralCode: formData.referralCode || undefined,
      };

      if (activeTab === "tutor") {
        payload.gender = selectedGender;
      }

      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (like 404 HTML pages from wrong servers)
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(
          `Server returned an unexpected response (${response.status}). Please ensure the backend is running on port 5000.`
        );
      }

      if (response.ok) {
        setAlert({
          open: true,
          message:
            data.message ||
            "Registration successful! Check your email to verify your account.",
          severity: "success",
        });
      } else {
        setAlert({
          open: true,
          message:
            data.message ||
            `Registration failed (${response.status}). Please try again.`,
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

  // --- Design Colors/Constants from Image ---
  const COLOR_STUDENT_TAB_ACTIVE = "#C89E45"; // Brand gold color - consistent with brand identity
  const COLOR_BUTTON_BLUE_GRADIENT = {
    start: "#4898e3",
    end: "#19619b",
  };
  const COLOR_RIGHT_SIDE_GRADIENT = {
    start: "#366d9c", // Deep blue
    end: "#47a3e7", // Lighter blue
  };
  const COLOR_LINK_RED = "#f0646c";

  const handleGoogleSignUp = () => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const role = activeTab === "tutor" ? "tutor" : "student";
    window.location.href = `${apiUrl}/api/v1/auth/google?role=${encodeURIComponent(role)}`;
  };

  return (
    <div className="min-h-screen flex antialiased">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 overflow-y-auto">
        {/* Adjusted padding to center the content more vertically, and py for mobile space */}
        <div className="w-full max-w-md my-8">
          {/* Back to login - Match font and alignment */}
          <Link
            to="/signin"
            className="flex items-center text-gray-700 hover:text-gray-900 mb-8 text-sm font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to login
          </Link>

          {/* Title */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Create Your Account
            </h1>
            <p className="text-gray-500 text-sm font-normal">
              Join thousands of learners and tutors worldwide
            </p>
          </div>

          {/* Toggle Tabs - Styled to match the screenshot exactly */}
          <div className="flex rounded-md overflow-hidden mb-7 border border-brand-gold">
            <button
              onClick={() => setActiveTab("student")}
              // Use specific color for active tab and border
              style={{
                backgroundColor:
                  activeTab === "student" ? COLOR_STUDENT_TAB_ACTIVE : "white",
              }}
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors border-r border-brand-gold 
                ${
                  activeTab === "student"
                    ? "text-white"
                    : "text-gray-700 bg-white hover:bg-gray-50"
                }`}
            >
              <span className="flex flex-col leading-tight">
                <span className="text-base font-semibold">Learner</span>
                <span className="text-xs font-normal">Guardian</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("tutor")}
              // Use specific color for active tab and border
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Name Fields - Side by Side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* First Name */}
              <div>
                {/* Match label style */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  // Match border color, rounded shape, and remove focus ring for a tighter match
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                />
              </div>

              {/* Last Name */}
              <div>
                {/* Match label style */}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  // Match border color, rounded shape, and remove focus ring for a tighter match
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Legal last name is private and only visible to Tutor Scene Admin.
            </p>

            {/* Email and Phone - Side by Side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  // Match border color, rounded shape, and remove focus ring for a tighter match
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  // Match border color, rounded shape, and remove focus ring for a tighter match
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Enter referral code"
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
              />
            </div>

            {/* Gender Identity - Only for Tutors */}
            {activeTab === "tutor" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your gender identity?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  (Select one option.)
                </p>
                <div className="space-y-2">
                  {["Woman", "Man", "Prefer not to say"].map((gender) => (
                    <label
                      key={gender}
                      className="flex items-start cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="genderIdentity"
                        checked={selectedGender === gender}
                        onChange={() => setSelectedGender(gender)}
                        className="mt-0.5 h-4 w-4 text-brand-medium-blue border-gray-400 rounded focus:ring-brand-medium-blue"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {gender}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  // Match border color, padding, and size
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm pr-10 text-gray-600"
                  style={{
                    fontFamily: showPassword ? "inherit" : "text-security-disc",
                  }} // Simulating dots for password field
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1" // Adjusted position/size
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  // Match border color, padding, and size - add red border if passwords don't match
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none text-sm pr-10 text-gray-600 ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? "border-red-500"
                      : "border-gray-400"
                  }`}
                  style={{
                    fontFamily: showConfirmPassword
                      ? "inherit"
                      : "text-security-disc",
                  }} // Simulating dots for password field
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1" // Adjusted position/size
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    Passwords do not match
                  </p>
                )}
            </div>

            {/* Terms and Conditions - Matched checkbox style and link color */}
            <div className="mb-7">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  // Match checkbox size and color with brand colors
                  className="mt-0.5 h-4 w-4 text-brand-medium-blue border-gray-400 rounded focus:ring-brand-medium-blue"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to all the{" "}
                  <a
                    href="#terms"
                    style={{ color: COLOR_LINK_RED }}
                    className="hover:underline font-medium"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="#privacy"
                    style={{ color: COLOR_LINK_RED }}
                    className="hover:underline font-medium"
                  >
                    Privacy Policies
                  </a>
                </span>
              </label>
            </div>

            {/* Sign Up Button - Created a custom gradient background to match the image */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full text-white font-semibold py-3.5 px-4 rounded-lg transition-shadow mb-4 text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: `linear-gradient(to right, ${COLOR_BUTTON_BLUE_GRADIENT.start}, ${COLOR_BUTTON_BLUE_GRADIENT.end})`,
              }}
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>

            {/* Sign In Link - Matched link color */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="text-brand-medium-blue hover:text-brand-dark-blue hover:underline font-medium"
              >
                Sign in
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

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleGoogleSignUp}
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
                  Sign up with Google
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
                  Sign up with Apple
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Welcome Image/Text */}
      <div
        className="hidden md:flex md:w-1/2 items-start justify-center relative overflow-hidden p-12" // Increased padding for better content placement
        style={{
          // Apply background gradient from the image
          background: `linear-gradient(180deg, ${COLOR_RIGHT_SIDE_GRADIENT.start} 0%, ${COLOR_RIGHT_SIDE_GRADIENT.end} 100%)`,
        }}
      >
        {/* The image in the screenshot is part of the background/overlay, not just a simple div. 
            For the best match, we'll embed the image using an `<img>` tag and use an overlay to achieve the color effect. */}

        {/* Background Image - Absolute positioning for the large image */}
        <img
          src="/images/signup-bg.jpg" // Assuming this path points to an image similar to the one in the screenshot
          alt="Tutor and student learning"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Blue Overlay - To give the image the deep blue wash */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${COLOR_RIGHT_SIDE_GRADIENT.start}cc 0%, ${COLOR_RIGHT_SIDE_GRADIENT.end}cc 100%)`,
            // The 'cc' at the end of the hex code is for 80% opacity, which helps the content stand out
          }}
        />

        {/* Content */}
        {/* Adjusted to move all content to bottom center */}
        <div className="relative z-10 text-center text-white flex flex-col justify-end h-full pb-8">
          {/* Spacer to push content to bottom */}
          <div className="flex-grow"></div>

          {/* Welcome Text - Moved to bottom */}
          <h2 className="text-4xl font-bold mb-4 leading-snug bg-transparent">
            Get Started and
            <br />
            Unlock Your Potential
          </h2>

          {/* Description - Moved to bottom */}
          <p className="text-lg font-normal mb-10 leading-relaxed">
            Join thousands of learners and tutors
            <br />
            connecting for better education worldwide.
          </p>

          {/* Feature Badges - Positioned at the bottom center */}
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

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
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

export default SignUp;

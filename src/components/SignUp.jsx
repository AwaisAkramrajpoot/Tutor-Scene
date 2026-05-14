import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// Utility for Eye/Eye-Slash icons
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

const PASSWORD_REQUIREMENTS = [
  {
    key: "len",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  {
    key: "upper",
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: "lower",
    label: "One lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  {
    key: "num",
    label: "One number",
    test: (p) => /[0-9]/.test(p),
  },
  {
    key: "special",
    label: "One special character",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

function passwordMeetsAllRules(password) {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(password));
}

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
    referralCode: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // Phone state — stores the full international number (e.g. "+15551234567")
  const [phoneNumber, setPhoneNumber] = useState("");

  const [selectedGender, setSelectedGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [roleChoiceModalOpen, setRoleChoiceModalOpen] = useState(true);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const confirmSignupRole = (role) => {
    setActiveTab(role);
    setRoleChoiceModalOpen(false);
  };

  const passwordIsStrong = passwordMeetsAllRules(formData.password);

  const isFormValid = () => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.email.trim() !== "" &&
      phoneNumber.length > 4 && // at least country code + a few digits
      passwordIsStrong &&
      formData.confirmPassword.trim() !== "" &&
      formData.password === formData.confirmPassword &&
      (activeTab !== "tutor" || selectedGender.trim() !== "") &&
      formData.agreeTerms
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agreeTerms) {
      setSnackbar({
        open: true,
        message: "Please agree to the Terms and Privacy Policies",
        severity: "error",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      return;
    }

    if (!passwordIsStrong) {
      setSnackbar({
        open: true,
        message:
          "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters.",
        severity: "error",
      });
      return;
    }

    if (!phoneNumber || phoneNumber.length <= 4) {
      setSnackbar({
        open: true,
        message: "Please enter a valid phone number.",
        severity: "error",
      });
      return;
    }

    if (activeTab === "tutor" && !selectedGender.trim()) {
      setSnackbar({
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
        // phoneNumber already includes the country dial code e.g. "+15551234567"
        phone: `+${phoneNumber}`,
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
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error(
          `Server returned an unexpected response (${response.status}). Please ensure the backend is running on port 5000.`
        );
      }

      if (response.ok) {
        navigate("/", {
          replace: true,
          state: { showPostSignupEmailVerify: true },
        });
        return;
      }
      setSnackbar({
        open: true,
        message:
          data.message ||
          `Registration failed (${response.status}). Please try again.`,
        severity: "error",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error.message || "Network error. Please check your connection.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Design Colors ---
  const COLOR_STUDENT_TAB_ACTIVE = "#C89E45";
  const COLOR_BUTTON_BLUE_GRADIENT = {
    start: "#4898e3",
    end: "#19619b",
  };
  const COLOR_RIGHT_SIDE_GRADIENT = {
    start: "#366d9c",
    end: "#47a3e7",
  };
  const COLOR_LINK_RED = "#f0646c";

  const handleGoogleSignUp = () => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const role = activeTab === "tutor" ? "tutor" : "student";
    window.location.href = `${apiUrl}/api/v1/auth/google?role=${encodeURIComponent(role)}`;
  };

  return (
    <>
      <Dialog
        open={roleChoiceModalOpen}
        onClose={(_, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            return;
          }
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        aria-labelledby="signup-role-dialog-title"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle id="signup-role-dialog-title" component="div">
          <div className="text-xl font-bold text-gray-900 pr-6">
            How would you like to use Tutor Scene?
          </div>
          <p className="text-sm font-normal text-gray-600 mt-2 mb-0">
            Select the type of account you want to create before continuing.
          </p>
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={() => confirmSignupRole("student")}
              className="w-full text-left rounded-lg border-2 border-brand-gold p-4 transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:ring-offset-2"
            >
              <div className="text-base font-semibold text-gray-900">
                Learner / Guardian
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Find tutors, book sessions, and manage learning for yourself or your family.
              </div>
            </button>
            <button
              type="button"
              onClick={() => confirmSignupRole("tutor")}
              className="w-full text-left rounded-lg border-2 border-brand-gold p-4 transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:ring-offset-2"
            >
              <div className="text-base font-semibold text-gray-900">Tutor</div>
              <div className="text-sm text-gray-600 mt-1">
                Create a tutor profile, connect with students, and teach on the platform.
              </div>
            </button>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4 flex-wrap gap-2">
          <Button onClick={() => navigate("/signin")} color="inherit">
            Back to sign in
          </Button>
        </DialogActions>
      </Dialog>
      {/*
        react-phone-input-2 override styles.
        These target the library's default classes to match the form's existing look.
      */}
      <style>{`
        /* Container */
        .tutor-phone-wrap .react-tel-input {
          width: 100%;
        }

        /* The flag-button (left side) */
        .tutor-phone-wrap .react-tel-input .flag-dropdown {
          background-color: white;
          border: 1px solid #9ca3af; /* matches border-gray-400 */
          border-right: none;
          border-radius: 6px 0 0 6px;
        }
        .tutor-phone-wrap .react-tel-input .flag-dropdown:hover,
        .tutor-phone-wrap .react-tel-input .flag-dropdown.open {
          background-color: #f9fafb;
          border-radius: 6px 0 0 6px;
        }
        .tutor-phone-wrap .react-tel-input .selected-flag {
          border-radius: 6px 0 0 6px;
          padding: 0 8px 0 10px;
        }
        .tutor-phone-wrap .react-tel-input .selected-flag:hover,
        .tutor-phone-wrap .react-tel-input .selected-flag:focus {
          background-color: #f3f4f6;
        }

        /* The text input */
        .tutor-phone-wrap .react-tel-input .form-control {
          width: 100%;
          height: 38px;             /* matches py-2 input height */
          padding-left: 52px;
          padding-right: 12px;
          border: 1px solid #9ca3af; /* border-gray-400 */
          border-radius: 6px;        /* rounded-md */
          font-size: 0.875rem;       /* text-sm */
          color: #4b5563;            /* text-gray-600 */
          outline: none;
          box-shadow: none;
          transition: border-color 0.15s;
          background-color: white;
        }
        .tutor-phone-wrap .react-tel-input .form-control:focus {
          outline: none;
          box-shadow: none;
          border-color: #9ca3af;
        }

        /* Dropdown panel */
        .tutor-phone-wrap .react-tel-input .country-list {
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          margin-top: 2px;
          font-size: 0.875rem;
          color: #374151;
          max-height: 220px;
          overflow-y: auto;
          z-index: 9999;
        }
        .tutor-phone-wrap .react-tel-input .country-list .country {
          padding: 8px 12px;
        }
        .tutor-phone-wrap .react-tel-input .country-list .country:hover,
        .tutor-phone-wrap .react-tel-input .country-list .country.highlight {
          background-color: #f3f4f6;
        }
        .tutor-phone-wrap .react-tel-input .country-list .search {
          padding: 6px 10px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
        .tutor-phone-wrap .react-tel-input .country-list .search-box {
          width: 100%;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.8rem;
          outline: none;
        }
        .tutor-phone-wrap .react-tel-input .country-list .dial-code {
          color: #6b7280;
        }
      `}</style>

      <div className="min-h-screen flex antialiased">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center px-8 overflow-y-auto">
          <div className="w-full max-w-md my-8">
            {/* Back to login */}
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

            {/* Toggle Tabs */}
            <div className="flex rounded-md overflow-hidden mb-7 border border-brand-gold">
              <button
                onClick={() => setActiveTab("student")}
                style={{
                  backgroundColor:
                    activeTab === "student"
                      ? COLOR_STUDENT_TAB_ACTIVE
                      : "white",
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
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal First Name{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Last Name{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2 mb-4">
                Legal last name is private and only visible to Tutor Scene Admin.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none text-sm text-gray-600"
                />
              </div>

              {/* ─── Phone Number with Flag (react-phone-input-2) ─────────────── */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                {/*
                  Wrap with our custom class so scoped CSS overrides apply.
                  `value` holds the full number without the leading "+".
                  `onChange` receives (value, countryData, event, formattedValue).
                  We store value directly — when submitting, prefix with "+".
                */}
                <div className="tutor-phone-wrap">
                  <PhoneInput
                    country="us"
                    value={phoneNumber}
                    onChange={(value) => setPhoneNumber(value)}
                    enableSearch
                    searchPlaceholder="Search country..."
                    inputProps={{
                      name: "phone",
                      required: true,
                      placeholder: "Enter phone number",
                    }}
                  />
                </div>
                {phoneNumber && phoneNumber.length <= 4 && (
                  <p className="mt-1 text-xs text-red-500">
                    Please enter a valid phone number.
                  </p>
                )}
              </div>
              {/* ─────────────────────────────────────────────────────────────── */}
</div>
              {/* Referral Code */}
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

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none text-sm pr-10 text-gray-600 ${
                      formData.password && !passwordIsStrong
                        ? "border-red-500"
                        : "border-gray-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-600 font-medium">
                  Password must include:
                </p>
                <ul className="mt-1 space-y-1 text-xs text-gray-600">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const ok = req.test(formData.password);
                    return (
                      <li key={req.key} className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            formData.password
                              ? ok
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                          aria-hidden="true"
                        >
                          {formData.password ? (ok ? "✓" : "×") : "·"}
                        </span>
                        <span
                          className={
                            formData.password && !ok ? "text-red-600" : ""
                          }
                        >
                          {req.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {formData.password && !passwordIsStrong && (
                  <p className="mt-2 text-xs text-red-600" role="alert">
                    Password must be at least 8 characters long and include
                    uppercase letters, lowercase letters, numbers, and special
                    characters.
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none text-sm pr-10 text-gray-600 ${
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? "border-red-500"
                        : "border-gray-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
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

              {/* Terms */}
              <div className="mb-7">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
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

              {/* Sign Up Button */}
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

              {/* Sign In Link */}
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
          className="hidden md:flex md:w-1/2 items-start justify-center relative overflow-hidden p-12"
          style={{
            background: `linear-gradient(180deg, #366d9c 0%, #47a3e7 100%)`,
          }}
        >
          <img
            src="/images/signup-bg.jpg"
            alt="Tutor and student learning"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, #366d9ccc 0%, #47a3e7cc 100%)`,
            }}
          />
          <div className="relative z-10 text-center text-white flex flex-col justify-end h-full pb-8">
            <div className="flex-grow"></div>
            <h2 className="text-4xl font-bold mb-4 leading-snug bg-transparent">
              Get Started and
              <br />
              Unlock Your Potential
            </h2>
            <p className="text-lg font-normal mb-10 leading-relaxed">
              Join thousands of learners and tutors
              <br />
              connecting for better education worldwide.
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
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SignUp;
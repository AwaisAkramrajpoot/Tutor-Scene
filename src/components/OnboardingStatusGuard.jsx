import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OnboardingStatusGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);
  const [isAllowed, setIsAllowed] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");

      if (!userStr || !token) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      const user = JSON.parse(userStr);

      if (user.role !== "tutor") {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      const publicPaths = ["/signin", "/signup"];
      if (publicPaths.includes(location.pathname)) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      if (user.prospectStatus === "active") {
        try {
          const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
          const paymentResponse = await fetch(
            `${apiUrl}/api/v1/onboarding/payment-onboarded/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            const isPaymentOnboarded = paymentData.paymentOnBoarded;

            const updatedUser = { ...user, paymentOnBoarded: isPaymentOnboarded };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            if (isPaymentOnboarded === false) {
              const paymentSetupPaths = [
                "/tutor/wallet",
                "/tutor/onboarding/refresh",
                "/tutor/onboarding/complete",
              ];
              if (!paymentSetupPaths.includes(location.pathname)) {
                navigate("/tutor/wallet", { replace: true });
                setIsAllowed(false);
                setIsChecking(false);
                return;
              } else {
                setIsAllowed(true);
                setIsChecking(false);
                return;
              }
            }
          } else {
            if (user.paymentOnBoarded === false) {
              const paymentSetupPaths = [
                "/tutor/wallet",
                "/tutor/onboarding/refresh",
                "/tutor/onboarding/complete",
              ];
              if (!paymentSetupPaths.includes(location.pathname)) {
                navigate("/tutor/wallet", { replace: true });
                setIsAllowed(false);
                setIsChecking(false);
                return;
              } else {
                setIsAllowed(true);
                setIsChecking(false);
                return;
              }
            }
          }
        } catch (paymentError) {
          console.error("OnboardingStatusGuard - Error checking payment status:", paymentError);
          if (user.paymentOnBoarded === false) {
            const paymentSetupPaths = [
              "/tutor/wallet",
              "/tutor/onboarding/refresh",
              "/tutor/onboarding/complete",
            ];
            if (!paymentSetupPaths.includes(location.pathname)) {
              navigate("/tutor/wallet", { replace: true });
              setIsAllowed(false);
              setIsChecking(false);
              return;
            } else {
              setIsAllowed(true);
              setIsChecking(false);
              return;
            }
          }
        }
      }

      if (!user.prospectStatus) {
        const allowedOnboardingPaths = ["/create-profile", "/verify-identity"];
        const onVerifyIdentity =
          location.pathname === "/verify-identity" ||
          location.pathname.startsWith("/verify-identity/");
        if (!allowedOnboardingPaths.includes(location.pathname) && !onVerifyIdentity) {
          navigate("/create-profile", { replace: true });
          setIsAllowed(false);
          setIsChecking(false);
          return;
        } else {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
        const response = await fetch(
          `${apiUrl}/api/v1/onboarding/status/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const status = data.result || data.status || data.data?.status;

          const updatedUser = { ...user, prospectStatus: status };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          const paymentOnBoarded = user.paymentOnBoarded;

          const onboardingRoutes = [
            "/create-profile",
            "/verify-identity",
            "/become-tutor",
            "/ready-to-teach",
          ];
          const isOnboardingRoute = onboardingRoutes.includes(location.pathname);

          if (status === "pending") {
            try {
              const virtualResponse = await fetch(
                `${apiUrl}/api/v1/interviews/virtual/me`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              const virtualData = virtualResponse.ok ? await virtualResponse.json() : null;
              const isInterviewCompleted = !!(virtualData?.completed || user?.interviewCompleted);

              // ✅ Read verificationCompleted from latest localStorage
              const latestUserStr = localStorage.getItem("user");
              const latestUser = latestUserStr ? JSON.parse(latestUserStr) : user;
              const hasStartedVerification = latestUser?.verificationCompleted === true;

              const updatedPendingUser = {
                ...latestUser,
                prospectStatus: status,
                interviewCompleted: isInterviewCompleted,
              };
              localStorage.setItem("user", JSON.stringify(updatedPendingUser));

              if (isInterviewCompleted) {
                if (hasStartedVerification) {
                  setIsAllowed(true);
                } else {
                  const skipUnderReview =
                    process.env.REACT_APP_SKIP_PROFILE_UNDER_REVIEW === "true" ||
                    (process.env.NODE_ENV === "development" &&
                      process.env.REACT_APP_SKIP_PROFILE_UNDER_REVIEW !== "false");
                  const allowedAfterInterviewPaths = skipUnderReview
                    ? [
                        "/verify-identity",
                        "/create-profile",
                        "/interviews",
                        "/messages",
                        "/ready-to-teach",
                        "/tutor-dashboard",
                        "/admin-dashboard",
                        "/",
                      ]
                    : [
                        "/profile-under-review",
                        "/verify-identity",
                        "/interviews",
                        "/create-profile",
                        "/messages",
                      ];
                  const isAllowedPath = allowedAfterInterviewPaths.some((p) => {
                    if (p === "/") return location.pathname === "/";
                    return (
                      location.pathname === p || location.pathname.startsWith(`${p}/`)
                    );
                  });
                  if (!isAllowedPath) {
                    navigate(skipUnderReview ? "/verify-identity" : "/profile-under-review", {
                      replace: true,
                    });
                    setIsAllowed(false);
                  } else {
                    if (
                      skipUnderReview &&
                      location.pathname === "/profile-under-review"
                    ) {
                      navigate("/verify-identity", { replace: true });
                      setIsAllowed(false);
                    } else {
                      setIsAllowed(true);
                    }
                  }
                }
              } else {
                const allowedPendingPaths = ["/interviews", "/create-profile", "/messages"];
                const isAllowedPendingPath = allowedPendingPaths.some((path) =>
                  location.pathname.startsWith(path)
                );
                if (!isAllowedPendingPath) {
                  navigate("/interviews", { replace: true });
                  setIsAllowed(false);
                } else {
                  setIsAllowed(true);
                }
              }
            } catch (pendingCheckError) {
              console.error("Error checking pending interview progress:", pendingCheckError);
              if (
                location.pathname !== "/interviews" &&
                location.pathname !== "/create-profile"
              ) {
                navigate("/interviews", { replace: true });
                setIsAllowed(false);
              } else {
                setIsAllowed(true);
              }
            }
          } else if (status === "awaiting_interview") {
            const allowedPaths = ["/interviews", "/messages"];
            const isAllowedPath = allowedPaths.some((path) =>
              location.pathname.startsWith(path)
            );
            if (!isAllowedPath) {
              navigate("/interviews", { replace: true });
              setIsAllowed(false);
            } else {
              setIsAllowed(true);
            }
          } else if (status === "active") {
            try {
              const paymentResponse = await fetch(
                `${apiUrl}/api/v1/onboarding/payment-onboarded/${user.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                const isPaymentOnboarded = paymentData.paymentOnboarded;

                const updatedUserWithPayment = {
                  ...user,
                  prospectStatus: status,
                  paymentOnBoarded: isPaymentOnboarded,
                };
                localStorage.setItem("user", JSON.stringify(updatedUserWithPayment));

                if (isPaymentOnboarded === false) {
                  if (
                    location.pathname !== "/tutor/wallet" &&
                    location.pathname !== "/tutor/onboarding/refresh" &&
                    location.pathname !== "/tutor/onboarding/complete"
                  ) {
                    navigate("/tutor/wallet", { replace: true });
                    setIsAllowed(false);
                  } else {
                    setIsAllowed(true);
                  }
                } else {
                  if (isOnboardingRoute) {
                    navigate("/tutor-dashboard", { replace: true });
                    setIsAllowed(false);
                  } else {
                    setIsAllowed(true);
                  }
                }
              } else {
                if (paymentOnBoarded === false) {
                  if (
                    location.pathname !== "/tutor/wallet" &&
                    location.pathname !== "/tutor/onboarding/refresh" &&
                    location.pathname !== "/tutor/onboarding/complete"
                  ) {
                    navigate("/tutor/wallet", { replace: true });
                    setIsAllowed(false);
                  } else {
                    setIsAllowed(true);
                  }
                } else {
                  if (isOnboardingRoute) {
                    navigate("/tutor-dashboard", { replace: true });
                    setIsAllowed(false);
                  } else {
                    setIsAllowed(true);
                  }
                }
              }
            } catch (paymentError) {
              console.error("Error checking payment status:", paymentError);
              if (paymentOnBoarded === false) {
                if (
                  location.pathname !== "/tutor/wallet" &&
                  location.pathname !== "/tutor/onboarding/refresh" &&
                  location.pathname !== "/tutor/onboarding/complete"
                ) {
                  navigate("/tutor/wallet", { replace: true });
                  setIsAllowed(false);
                } else {
                  setIsAllowed(true);
                }
              } else {
                if (isOnboardingRoute) {
                  navigate("/tutor-dashboard", { replace: true });
                  setIsAllowed(false);
                } else {
                  setIsAllowed(true);
                }
              }
            }
          } else {
            setIsAllowed(true);
          }
        } else {
          console.error("Failed to check onboarding status");
          setIsAllowed(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate, location.pathname]);

  return isAllowed ? children : null;
};

export default OnboardingStatusGuard;
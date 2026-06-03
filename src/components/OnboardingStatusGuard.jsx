import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  isTutorOnboardingPath,
  isTutorPaymentSetupPath,
  mergeProspectStatusIntoUser,
  shouldForcePaymentSetup,
} from "../utils/tutorProspectStatus";
import {
  hasCompletedTutorOnboardingFlow,
  refreshTutorSessionOnboardingFlags,
} from "../utils/tutorOnboardingProgress";

const OnboardingStatusGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
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

      let user = JSON.parse(userStr);

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

      if (isTutorOnboardingPath(location.pathname) || isTutorPaymentSetupPath(location.pathname)) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
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
          },
        );

        if (!response.ok) {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        const status = data.result || data.status || data.data?.status;
        const hasPendingProfileUpdate = Boolean(
          data.hasPendingProfileUpdate ?? data.data?.hasPendingProfileUpdate,
        );

        user = mergeProspectStatusIntoUser(user, data);
        localStorage.setItem("user", JSON.stringify(user));

        if (hasPendingProfileUpdate) {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }

        const refreshed = await refreshTutorSessionOnboardingFlags(apiUrl, token, user);
        user = refreshed.user;

        if (hasCompletedTutorOnboardingFlow(user, refreshed)) {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }

        if (status === "pending") {
          if (!user.interviewCompleted) {
            const allowedPendingPaths = [
              "/interviews",
              "/create-profile",
              "/messages",
              "/",
              "/about",
              "/become-tutor",
            ];
            const isAllowedPendingPath = allowedPendingPaths.some(
              (path) =>
                location.pathname === path || location.pathname.startsWith(`${path}/`),
            );
            if (!isAllowedPendingPath) {
              navigate("/interviews", { replace: true });
              setIsAllowed(false);
            } else {
              setIsAllowed(true);
            }
          } else if (!user.verificationCompleted) {
            const allowedAfterInterviewPaths = [
              "/verify-identity",
              "/verify-identity/status",
              "/ready-to-teach",
              "/create-profile",
              "/interviews",
              "/messages",
              "/",
              "/about",
              "/become-tutor",
            ];
            const isAllowedPath = allowedAfterInterviewPaths.some((p) => {
              if (p === "/") return location.pathname === "/";
              return location.pathname === p || location.pathname.startsWith(`${p}/`);
            });
            if (!isAllowedPath) {
              navigate("/verify-identity", { replace: true });
              setIsAllowed(false);
            } else {
              setIsAllowed(true);
            }
          } else {
            setIsAllowed(true);
          }
          setIsChecking(false);
          return;
        }

        if (status === "awaiting_interview") {
          const allowedPaths = [
            "/interviews",
            "/create-profile",
            "/verify-identity",
            "/verify-identity/status",
            "/ready-to-teach",
            "/messages",
            "/",
            "/about",
            "/become-tutor",
          ];
          const isAllowedPath = allowedPaths.some(
            (path) =>
              location.pathname === path || location.pathname.startsWith(`${path}/`),
          );
          if (!isAllowedPath) {
            navigate(user.interviewCompleted ? "/verify-identity" : "/interviews", {
              replace: true,
            });
            setIsAllowed(false);
          } else {
            setIsAllowed(true);
          }
          setIsChecking(false);
          return;
        }

        if (status === "active") {
          let paymentOnBoarded = user.paymentOnBoarded;
          try {
            const paymentResponse = await fetch(
              `${apiUrl}/api/v1/onboarding/payment-onboarded/${user.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            );
            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              paymentOnBoarded = paymentData.paymentOnBoarded;
              user = {
                ...user,
                prospectStatus: status,
                publishedStatus: "active",
                paymentOnBoarded,
              };
              localStorage.setItem("user", JSON.stringify(user));
            }
          } catch {
            // keep stored payment flag
          }

          if (shouldForcePaymentSetup(user, location.pathname)) {
            navigate("/tutor/wallet", { replace: true });
            setIsAllowed(false);
          } else {
            setIsAllowed(true);
          }
          setIsChecking(false);
          return;
        }

        setIsAllowed(true);
      } catch {
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate, location.pathname]);

  if (isChecking) {
    return null;
  }

  return isAllowed ? children : null;
};

export default OnboardingStatusGuard;

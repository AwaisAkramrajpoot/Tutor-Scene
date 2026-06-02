import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getTutorOnboarding } from "../utils/onboarding";
import { TUTOR_ONBOARDING_STEPS } from "../components/TutorProfile/TutorOnboardingStepper";
import { showSystemMessage } from "../utils/systemMessage";
import {
  hasCompletedTutorOnboardingFlow,
  isInterviewStepComplete,
  isVerificationStepComplete,
  refreshTutorSessionOnboardingFlags,
} from "../utils/tutorOnboardingProgress";

export function useTutorOnboardingNavigation(activeKey) {
  const navigate = useNavigate();

  const currentStepIndex = useMemo(
    () => TUTOR_ONBOARDING_STEPS.findIndex((s) => s.key === activeKey),
    [activeKey],
  );

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) return;
    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      return;
    }
    if (user?.role !== "tutor") return;
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
    refreshTutorSessionOnboardingFlags(apiUrl, token, user);
  }, []);

  const onStepClick = useCallback(
    (index) => {
      const onboarding = getTutorOnboarding();
      let user = {};
      try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        user = {};
      }

      const target = TUTOR_ONBOARDING_STEPS[index];
      if (!target) return;

      if (hasCompletedTutorOnboardingFlow(user)) {
        navigate(target.path);
        return;
      }

      const localProfileFieldsComplete = Boolean(
        onboarding?.fullName &&
          onboarding?.dateOfBirth &&
          onboarding?.subjects &&
          onboarding?.yearsOfExperience !== undefined &&
          onboarding?.profilePic &&
          onboarding?.cv,
      );
      const prospectStatus = String(user?.prospectStatus || "");
      const profileSavedOnServer = ["pending", "awaiting_interview", "active"].includes(
        prospectStatus,
      );
      const profileGateComplete =
        localProfileFieldsComplete || profileSavedOnServer || isInterviewStepComplete(user);
      const isInterviewComplete = isInterviewStepComplete(user);
      const isVerificationComplete = isVerificationStepComplete(user, {
        govId: onboarding?.govId,
      });

      const canAccess = (i) => {
        if (i <= currentStepIndex) return true;
        if (i === 1) return profileGateComplete;
        if (i === 2) return profileGateComplete && isInterviewComplete;
        if (i === 3) return profileGateComplete && isInterviewComplete && isVerificationComplete;
        return false;
      };

      if (canAccess(index)) {
        navigate(target.path);
        return;
      }
      if (index === 1) {
        showSystemMessage({
          message: "Please complete and save your profile information first.",
          type: "warning",
        });
      } else if (index === 2) {
        showSystemMessage({
          message: "Please complete the interview step first.",
          type: "warning",
        });
      } else {
        showSystemMessage({
          message: "Please complete previous steps before moving ahead.",
          type: "warning",
        });
      }
    },
    [currentStepIndex, navigate],
  );

  return { onStepClick };
}

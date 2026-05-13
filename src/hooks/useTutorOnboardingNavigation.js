import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getTutorOnboarding } from "../utils/onboarding";
import { TUTOR_ONBOARDING_STEPS } from "../components/TutorProfile/TutorOnboardingStepper";

export function useTutorOnboardingNavigation(activeKey) {
  const navigate = useNavigate();

  const currentStepIndex = useMemo(
    () => TUTOR_ONBOARDING_STEPS.findIndex((s) => s.key === activeKey),
    [activeKey],
  );

  const onStepClick = useCallback(
    (index) => {
      const onboarding = getTutorOnboarding();
      let user = {};
      try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        user = {};
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
      const profileSavedOnServer = ["pending", "awaiting_interview", "active"].includes(prospectStatus);
      const profileGateComplete =
        localProfileFieldsComplete || profileSavedOnServer || Boolean(user?.interviewCompleted);
      const isInterviewComplete = Boolean(user?.interviewCompleted);
      const isVerificationComplete = Boolean(
        onboarding?.govId || user?.prospectStatus === "pending",
      );

      const canAccess = (i) => {
        if (i <= currentStepIndex) return true;
        if (i === 1) return profileGateComplete;
        if (i === 2) return profileGateComplete && isInterviewComplete;
        if (i === 3) return profileGateComplete && isInterviewComplete && isVerificationComplete;
        return false;
      };

      const target = TUTOR_ONBOARDING_STEPS[index];
      if (!target) return;
      if (canAccess(index)) {
        navigate(target.path);
        return;
      }
      if (index === 1) {
        window.alert("Please complete and save your profile information first.");
      } else if (index === 2) {
        window.alert("Please complete the interview step first.");
      } else {
        window.alert("Please complete previous steps before moving ahead.");
      }
    },
    [currentStepIndex, navigate],
  );

  return { onStepClick };
}

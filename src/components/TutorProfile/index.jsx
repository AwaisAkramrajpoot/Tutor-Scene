import React from "react";
import { useNavigate } from "react-router-dom";
import TutorInterviewsPage from "../Interviews/TutorInterviewsPage";
import { ProfileTipsSection } from "./ProfileTipsSection";
import { getTutorOnboarding } from "../../utils/onboarding";

export const CreateProfilePage = ({ step = "create-profile" }) => {
  const navigate = useNavigate();
  const onboarding = getTutorOnboarding();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const stepConfig = [
    { key: "create-profile", label: "Create Profile", path: "/create-profile" },
    { key: "interview", label: "Interview", path: "/interviews" },
    { key: "verify", label: "Get Verified", path: "/verify-identity" },
    { key: "start", label: "Start Tutoring", path: "/ready-to-teach" },
  ];

  const currentStepIndex = stepConfig.findIndex((s) => s.key === step);
  const isInterviewStep = step === "interview";

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
  const isVerificationComplete = Boolean(onboarding?.govId || user?.prospectStatus === "pending");

  const canAccessStep = (index) => {
    if (index <= currentStepIndex) return true;
    if (index === 1) return profileGateComplete;
    if (index === 2) return profileGateComplete && isInterviewComplete;
    if (index === 3) return profileGateComplete && isInterviewComplete && isVerificationComplete;
    return false;
  };

  const handleStepClick = (index) => {
    const target = stepConfig[index];
    if (!target) return;
    if (canAccessStep(index)) {
      navigate(target.path);
      return;
    }
    if (index === 1) {
      alert("Please complete and save your profile information first.");
    } else if (index === 2) {
      alert("Please complete the interview step first.");
    } else {
      alert("Please complete previous steps before moving ahead.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] flex flex-col">
      <div className="w-full bg-gradient-to-r from-[#6BA3D8] to-[#3D78BF] pt-10 pb-10">
        <div className="max-w-9xl mx-auto px-6 flex flex-col items-center">
          <h1 className="text-white text-5xl font-normal mb-4 text-center">Build Your Tutor Profile</h1>

          <p className="mb-8 max-w-2xl text-center text-lg text-white">
            Share your experience and subjects you tutor
          </p>

          <div className="rounded-2xl bg-white/20 px-3 py-2">
            <div className="flex items-center gap-2">
              {stepConfig.map((item, index) => {
                const isActive = index === currentStepIndex;
                return (
                  <React.Fragment key={item.key}>
                    {index > 0 && <div className="text-white text-xs">→</div>}
                    <button
                      type="button"
                      onClick={() => handleStepClick(index)}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${
                        isActive ? "bg-white" : "bg-white/15 hover:bg-white/25"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                          isActive ? "bg-[#4A8FCC] text-white font-semibold" : "bg-white/40 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className={`text-xs ${isActive ? "text-[#101727] font-medium" : "text-white/90"}`}>
                        {item.label}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        {isInterviewStep ? (
          <>
            <div className="mx-auto mb-10 max-w-3xl space-y-4 text-center text-base leading-relaxed text-[#374151] sm:text-lg">
              <p>
                Thank you for your interest in joining Tutor Scene. We are excited to get to know you through our
                virtual interview process.
              </p>
              <p>
                Pick one question for each of the 5 topics below, record your answer on video, and upload it. Feel free
                to save your progress and complete the interview later. You are in control. Once complete, select Save
                and Continue to submit your responses.
              </p>
              <p>We look forward to learning more about you.</p>
            </div>
            <TutorInterviewsPage embedded />
          </>
        ) : (
          <ProfileTipsSection />
        )}
      </div>
    </div>
  );
};

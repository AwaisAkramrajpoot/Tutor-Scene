import React from "react";
import TutorInterviewsPage from "../Interviews/TutorInterviewsPage";
import { ProfileTipsSection } from "./ProfileTipsSection";
import { TutorOnboardingStepper } from "./TutorOnboardingStepper";
import { useTutorOnboardingNavigation } from "../../hooks/useTutorOnboardingNavigation";

export const CreateProfilePage = ({ step = "create-profile" }) => {
  const isInterviewStep = step === "interview";
  const { onStepClick } = useTutorOnboardingNavigation(step);

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] flex flex-col">
      <div className="w-full bg-gradient-to-b from-[#6BA3D8] to-[#3D78BF] pt-10 pb-10">
        <div className="max-w-9xl mx-auto px-6 flex flex-col items-center">
          {isInterviewStep ? (
            <>
              <h1 className="text-white text-4xl sm:text-5xl font-normal mb-6 text-center">
                Tutor Virtual Interview
              </h1>
              <div className="mx-auto mb-8 max-w-3xl space-y-4 text-center text-base leading-relaxed text-white sm:text-[14px]">
                <p>
                  Thank you for your interest in joining Tutor Scene. We are excited to get to know you through our
                  virtual interview process.
                </p>
                <p>
                  Pick one question for each of the 5 topics below, record your
                  answer on video, and upload it. Feel free to save your
                  progress and complete the interview later. You are in control.
                  Once complete, select Save and Continue to submit your
                  responses.
                </p>
                <p>We look forward to learning more about you.</p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-white text-5xl font-normal mb-4 text-center">Build Your Tutor Profile</h1>
              <p className="mb-8 max-w-2xl text-center text-lg text-white">
                Share your experience and subjects you tutor
              </p>
            </>
          )}

          <TutorOnboardingStepper activeKey={step} onStepClick={onStepClick} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        {isInterviewStep ? (
          <TutorInterviewsPage embedded />
        ) : (
          <ProfileTipsSection />
        )}
      </div>
    </div>
  );
};

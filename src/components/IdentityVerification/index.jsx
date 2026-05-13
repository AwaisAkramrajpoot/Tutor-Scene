import React from "react";
import { VerificationProcessSection } from "./VerificationProcessSection";
import { TutorOnboardingStepper } from "../TutorProfile/TutorOnboardingStepper";
import { useTutorOnboardingNavigation } from "../../hooks/useTutorOnboardingNavigation";

export const GetVerified = () => {
  const step = "verify";
  const { onStepClick } = useTutorOnboardingNavigation(step);

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8] pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <h1 className="text-white text-6xl font-normal mb-4 text-center">
            Verify Your Identity
          </h1>

          <p className="text-[#DAEAFE] text-lg text-center max-w-3xl leading-relaxed">
            We keep our platform safe by verifying all tutors.
          </p>
          <p className="text-[#DAEAFE] text-lg mb-10 text-center max-w-3xl leading-relaxed">
            Complete your background check securely.
          </p>

          <TutorOnboardingStepper activeKey={step} onStepClick={onStepClick} />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <VerificationProcessSection />
      </div>
    </div>
  );
};

export { VerificationStatusPage } from "./VerificationStatusPage";

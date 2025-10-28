import React from "react";
import { VerificationProcessSection } from "./VerificationProcessSection";

export const GetVerified = () => {
  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8] pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          {/* Badge */}
          <div className="bg-white rounded-full px-6 py-2 mb-6">
            <span className="text-[#2A66B8] text-sm font-normal">TUTOR SCENE</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-white text-6xl font-normal mb-4 text-center">
            Verify Your Identity.
          </h1>
          
          {/* Subtitle */}
          <p className="text-[#DAEAFE] text-xl mb-10 text-center max-w-3xl leading-relaxed">
            We keep our platform safe by verifying all tutors. Complete your background check securely.
          </p>
          
          {/* Stepper */}
          <div className="flex items-center gap-3 bg-white/10 rounded-full px-8 py-4">
            {/* Step 1 - Inactive */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-base">
                1
              </div>
              <span className="text-white/80 text-base">Create Profile</span>
            </div>
            
            {/* Arrow */}
            <div className="text-[#BDDAFF] text-base px-2">→</div>
            
            {/* Step 2 - Active */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white text-[#2A66B8] flex items-center justify-center text-base font-medium">
                2
              </div>
              <span className="text-white text-base font-normal">Get Verified</span>
            </div>
            
            {/* Arrow */}
            <div className="text-[#BDDAFF] text-base px-2">→</div>
            
            {/* Step 3 - Inactive */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-base">
                3
              </div>
              <span className="text-white/80 text-base">Start Teaching</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <VerificationProcessSection />
      </div>
    </div>
  );
};

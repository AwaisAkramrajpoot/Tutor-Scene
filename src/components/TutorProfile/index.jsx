import React from "react";
import { ProfileTipsSection } from "./ProfileTipsSection";

export const CreateProfilePage = () => {
  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] flex flex-col">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-[#6BA3D8] to-[#4A8FCC] pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          {/* Badge */}
          {/* Main Heading */}
          <h1 className="text-white text-5xl font-normal mb-4 text-center">
            Build Your Tutor Profile
          </h1>
          
          {/* Subtitle */}
          <p className="text-white text-lg mb-8 text-center max-w-2xl">
            Share your experience and subjects you tutor
          </p>
          
          {/* Stepper */}
          <div className="flex items-center gap-3">
            {/* Step 1 - Active */}
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2">
              <div className="w-6 h-6 rounded-full bg-[#4A8FCC] text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-[#101727] text-sm font-medium">Create Profile</span>
            </div>
            
            {/* Arrow */}
            <div className="text-white text-sm">→</div>
            
            {/* Step 2 - Inactive */}
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <div className="w-6 h-6 rounded-full bg-white/40 text-white flex items-center justify-center text-sm">
                2
              </div>
              <span className="text-white/80 text-sm">Interview</span>
            </div>
            
            {/* Arrow */}
            <div className="text-white text-sm">→</div>
            
            {/* Step 3 - Inactive */}
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <div className="w-6 h-6 rounded-full bg-white/40 text-white flex items-center justify-center text-sm">
                3
              </div>
              <span className="text-white/80 text-sm">Get Verified</span>
            </div>

            <div className="text-white text-sm">→</div>

            {/* Step 4 - Inactive */}
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <div className="w-6 h-6 rounded-full bg-white/40 text-white flex items-center justify-center text-sm">
                4
              </div>
              <span className="text-white/80 text-sm">Start Tutoring</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        <ProfileTipsSection />
      </div>
    </div>
  );
};

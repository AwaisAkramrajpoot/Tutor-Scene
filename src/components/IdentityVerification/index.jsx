import React from "react";
import { Link } from "react-router-dom";
import { VerificationProcessSection } from "./VerificationProcessSection";

export const GetVerified = () => {
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

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 sm:gap-3 sm:px-6">
            <Link
              to="/create-profile"
              className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-white/90 no-underline transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm text-white">
                1
              </div>
              <span className="text-sm text-white/90">Create Profile</span>
            </Link>

            <div className="px-1 text-sm text-[#BDDAFF]">→</div>

            <Link
              to="/interviews"
              className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-white/90 no-underline transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm text-white">
                2
              </div>
              <span className="text-sm text-white/90">Interview</span>
            </Link>

            <div className="px-1 text-sm text-[#BDDAFF]">→</div>

            <div className="flex items-center gap-2 rounded-lg px-1 py-0.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-medium text-[#2A66B8]">
                3
              </div>
              <span className="text-sm font-normal text-white">Get Verified</span>
            </div>

            <div className="px-1 text-sm text-[#BDDAFF]">→</div>

            <div className="flex items-center gap-2 px-1 py-0.5 opacity-90">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm text-white">
                4
              </div>
              <span className="text-sm text-white/80">Start Tutoring</span>
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

export { VerificationStatusPage } from "./VerificationStatusPage";

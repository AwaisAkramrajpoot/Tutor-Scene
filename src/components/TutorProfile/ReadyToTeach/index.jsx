import React from "react";
import { ApprovalMessageSection } from "./ApprovalMessageSection";
import { AvailabilitySection } from "./AvailabilitySection";
import { DashboardPreviewSection } from "./DashboardPreviewSection";
import { TipsForSuccessSection } from "./TipsForSuccessSection";

export const StartTeachingPage = ()=> {
  return (
    <div className="w-full min-h-screen bg-white">
      <AvailabilitySection />
      <ApprovalMessageSection />
      <DashboardPreviewSection />
      <TipsForSuccessSection />
    </div>
  );
};
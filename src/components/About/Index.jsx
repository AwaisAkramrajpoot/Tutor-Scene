import React from "react";
import { ContactSection } from "./ContactSection";
import { HeroSection } from "./HeroSection";
import { MissionSection } from "./MissionSection";
import { StatsSection } from "./StatsSection";
import { ValuesSection } from "./ValuesSection";

export const AboutPage = () => {
  return (
    <div className="w-full bg-white">
      <HeroSection />
      <MissionSection />
      <StatsSection />
      <ContactSection />
      <ValuesSection />
    </div>
  );
};

import React from "react";
import { ContactSection } from "./ContactSection";
import { HeroSection } from "./HeroSection";
import { MissionSection } from "./MissionSection";
import { StatsSection } from "./StatsSection";
import { TeamSection } from "./TeamSection";
import { ValuesSection } from "./ValuesSection";

export const AboutPage = () => {
  return (
    <div className="w-full bg-white">
      <HeroSection />
      <MissionSection />
      <TeamSection />
      <StatsSection />
      <ContactSection />
      <ValuesSection />
    </div>
  );
};

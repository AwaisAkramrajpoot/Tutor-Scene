import React from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { WhyTeachSection } from "./WhyTeachSection";

export const Home = () => {
  const navigate = useNavigate();
  
  const ctaData = {
    title: "Ready to Start Teaching?",
    subtitle: "Join our community of expert tutors and make a difference today",
    buttonText: "Get Started",
  
  };

  return (
    <div className="w-full bg-white">
      <HeroSection />
      
      {/* Why Teach Header */}
      <section className="w-full py-16 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl text-[#2d3660] font-semibold mb-4">
            Why Teach on Tutor Scene?
          </h2>
          <p className="text-[#62698b] text-2xl">
            Join and Make A Difference
          </p>
        </div>
      </section>

      <FeaturesSection />
      <WhyTeachSection />

      {/* CTA Section */}
      <section className="w-full bg-gradient-to-b from-[#3495da]/80 to-[#3495da] text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">{ctaData.title}</h2>
          <p className="text-xl mb-8">{ctaData.subtitle}</p>
          <button 
            onClick={() => navigate('/create-profile')}
            className="px-8 py-3 bg-white text-[#3495da] font-semibold text-lg rounded-lg hover:bg-opacity-90 transition-all"
          >
            {ctaData.buttonText}
          </button> 
        </div>
      </section>
    </div>
  );
};

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
    stats: [
      { value: "10,000+", label: "Active Students" },
      { value: "5,000+", label: "Expert Tutors" },
      { value: "50+", label: "Subjects Covered" },
    ],
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
            Join thousands of tutors making a difference
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
          <div className="flex flex-wrap justify-center gap-12 mt-12">
            {ctaData.stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="font-bold text-3xl">{stat.value}</span>
                <span className="text-base mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

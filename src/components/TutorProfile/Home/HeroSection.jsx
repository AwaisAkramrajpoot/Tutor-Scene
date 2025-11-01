import React from "react";
import { useNavigate } from "react-router-dom";

const TUTOR_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='700'><rect width='100%' height='100%' fill='%2347A6E2'/><circle cx='300' cy='300' r='200' fill='white' opacity='0.3'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='Arial'>Professional Tutor</text></svg>";

export const HeroSection = () => {
  const navigate = useNavigate();
  const statsCards = [
    { id: 1, icon: "📊", value: "10K+", label: "Successful Lessons" },
    { id: 2, icon: "📚", value: "20+", label: "Subjects Available" },
    { id: 3, icon: "👨‍🏫", value: "250+", label: "Tutors" },
  ];

  const features = [
    { id: 1, icon: "🎤", label: "Public Speaking" },
    { id: 2, icon: "💼", label: "Career-Oriented" },
    { id: 3, icon: "💡", label: "Creative Thinking" },
  ];

  return (
    <section className="w-full bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <div className="mb-2">TUTOR SCENE</div>
              Share Your <span className="text-[#fce113]">Knowledge.</span>{" "}
              Inspire Students Worldwide.
            </h1>
            <p className="text-xl mb-8 max-w-xl">
              Join our community of passionate tutors and teach online on your schedule.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="px-8 py-4 bg-white text-[#0550af] font-semibold text-lg rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                Become a Tutor
              </button>
              <button onClick={()=>navigate("/create-profile")} className="px-8 py-4 border-2 border-white text-white font-semibold text-lg rounded-lg hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
            <ul className="flex flex-wrap gap-8 list-none p-0 m-0">
              {features.map((feature) => (
                <li key={feature.id} className="flex items-center gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right image/illustration */}
          <div className="relative">
            <div className="rounded-full border-4 border-[#fcb209] p-8">
              <img
                src={TUTOR_PLACEHOLDER}
                alt="Professional tutor"
                className="w-full h-auto rounded-full"
              />
            </div>

            {/* Floating stat cards */}
            <div className="hidden lg:block">
              {statsCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`absolute bg-white/95 rounded-2xl p-4 shadow-xl ${index === 0 ? "top-10 -right-4" :
                    index === 1 ? "bottom-1/2 -left-8" :
                      "bottom-10 -right-4"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{card.icon}</span>
                    <div>
                      <div className="text-[#101828] font-bold text-2xl">{card.value}</div>
                      <div className="text-[#101828]/50 text-sm">{card.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

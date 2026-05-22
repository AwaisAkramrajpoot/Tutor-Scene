import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../../../utils/api";

const callouts = [
  {
    id: 1,
    label: "Flexible Schedule!",
    position: "top-6 -left-3 sm:-left-6",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 2,
    label: "Set Your Rate!",
    position: "top-6 -right-3 sm:-right-6",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 3,
    label: "Earn Tips Too!",
    position: "bottom-16 -left-3 sm:-left-4",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a4 4 0 00-4 4v4m8-8v13m0-13V6a4 4 0 00-4 4v4" />
      </svg>
    ),
  },
  {
    id: 4,
    label: "Seamless Onboarding!",
    position: "bottom-16 -right-3 sm:-right-4",
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const features = [
  { id: 1, label: "Public Speaking" },
  { id: 2, label: "Career-Oriented" },
  { id: 3, label: "Creative Thinking" },
];

export const HeroSection = () => {
  const navigate = useNavigate();

  const handleBecomeTutor = () => {
    if (isAuthenticated() && getCurrentUser()?.role === "tutor") {
      navigate("/create-profile");
      return;
    }
    navigate("/signin");
  };

  const handleLearnMore = () => {
    const section = document.getElementById("why-teach-on-tutor-scene");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative bg-gradient-to-r from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-brand-light-blue rounded-full opacity-20"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-brand-gold rounded-full opacity-30"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-brand-light-blue rounded-full opacity-25"></div>
        <div className="absolute top-60 right-1/3 w-8 h-8 bg-brand-gold rounded-full opacity-40"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Share Your</span>
                <br />
                <span className="text-brand-gold">Knowledge.</span>
                <br />
                <span className="text-white">Inspire Students Worldwide.</span>
              </h1>
            </div>

            <p className="text-xl text-brand-light-blue max-w-lg">
              Join our community of passionate tutors and tutor online on your schedule.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleBecomeTutor}
                className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-transparent hover:border-brand-gold"
              >
                Become a Tutor
              </button>
              <button
                type="button"
                onClick={handleLearnMore}
                className="bg-white text-brand-dark-blue hover:bg-brand-gold hover:text-white font-semibold py-4 px-8 rounded-lg border-2 border-brand-gold transition-all shadow-lg"
              >
                Learn More
              </button>
            </div>

            <div className="flex flex-wrap gap-6">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <div
                    className={`w-8 h-8 ${
                      feature.id === 1
                        ? "bg-pink-500"
                        : feature.id === 2
                          ? "bg-amber-600"
                          : "bg-yellow-500"
                    } rounded-full flex items-center justify-center`}
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] sm:min-h-[480px]">
            <div className="relative flex justify-center">
              <img
                src="/images/tutorbg.png"
                alt="Professional tutor"
                className="w-full h-auto max-h-[500px] object-contain rounded-lg"
              />
            </div>

            {callouts.map((callout) => (
              <div
                key={callout.id}
                className={`absolute ${callout.position} bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 max-w-[11rem] sm:max-w-xs z-10`}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {callout.icon}
                </div>
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  {callout.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

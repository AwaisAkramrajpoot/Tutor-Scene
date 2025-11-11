import { useNavigate } from "react-router-dom";

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
    <section className="relative bg-gradient-to-r from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue text-white overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-brand-light-blue rounded-full opacity-20"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-brand-gold rounded-full opacity-30"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-brand-light-blue rounded-full opacity-25"></div>
        <div className="absolute top-60 right-1/3 w-8 h-8 bg-brand-gold rounded-full opacity-40"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
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
              Join our community of passionate tutors and teach online on your schedule.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => navigate('/create-profile')}
                className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white font-semibold py-4 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl border-2 border-transparent hover:border-brand-gold"
              >
                Become a Tutor
              </button>
              <button 
                onClick={() => navigate("/create-profile")} 
                className="bg-white text-brand-dark-blue hover:bg-brand-gold hover:text-white font-semibold py-4 px-8 rounded-lg border-2 border-brand-gold transition-all shadow-lg"
              >
                Learn More
              </button>
            </div>

            <div className="flex flex-wrap gap-6">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 ${
                    feature.id === 1 ? 'bg-pink-500' : 
                    feature.id === 2 ? 'bg-amber-600' : 
                    'bg-yellow-500'
                  } rounded-full flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right image/illustration */}
          <div className="relative">
            <div className="relative">
              <img
                src="/images/tutorbg.png"
                alt="Professional tutor"
                className="w-full h-auto max-h-[500px] object-contain rounded-lg"
              />
            </div>

            {/* Floating stat cards */}
            {statsCards.map((card, index) => (
              <div
                key={card.id}
                className={`absolute bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-xs ${
                  index === 0 ? "top-8 -right-4" :
                  index === 1 ? "top-8 -left-4" :
                  "bottom-8 -right-4"
                }`}
              >
                {index === 1 ? (
                  <>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                      <div className="text-xs text-gray-600">{card.label}</div>
                    </div>
                  </>
                ) : index === 0 ? (
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                    <div className="text-xs text-gray-600">{card.label}</div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">{card.label}</div>
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

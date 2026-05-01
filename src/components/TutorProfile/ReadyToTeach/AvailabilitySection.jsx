export const AvailabilitySection = () => {
  const steps = [
    { number: "1", label: "Create Profile", isActive: false },
    { number: "2", label: "Get Verified", isActive: false },
    { number: "3", label: "Start Tutoring", isActive: true },
  ];

  return (
    <section className="w-full bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center bg-white text-[#2A66B8] rounded-full px-4 py-2 text-base font-normal">
          TUTOR SCENE
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal">
          You&#39;re Ready to Teach!
        </h1>
        <p className="mt-4 text-brand-light-blue text-base sm:text-lg max-w-3xl mx-auto">
          Once approved, set your schedule and start connecting with students from around the world.
        </p>
        <nav aria-label="Progress steps" className="mt-8 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-2">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${!step.isActive ? "opacity-60" : ""}`} aria-current={step.isActive ? "step" : undefined}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.isActive ? "bg-white text-[#2A66B8]" : "bg-white/30 text-white"}`}>
                  <span className="text-base">{step.number}</span>
                </div>
                <span className="text-sm whitespace-nowrap">{step.label}</span>
              </div>
              {i < steps.length - 1 && <span className="text-brand-gold">→</span>}
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
};

import React from "react";

export const WhyTeachSection = () => {
  const steps = [
    {
      id: 1,
      title: "Create Your Profile",
      description:
        "Sign up and tell us about your expertise, experience, and teaching style.",
      bgColor: "bg-[#0f3e78]",
      textColor: "text-white",
    },
    {
      id: 2,
      title: "Get Verified",
      description:
        "Complete our quick verification process to join our trusted tutor community.",
      bgColor: "bg-[#2a66b8]",
      textColor: "text-white",
    },
    {
      id: 3,
      title: "Start Teaching",
      description:
        "Set your schedule, connect with students, and start making an impact!",
      bgColor: "bg-[#a8c7f0]",
      textColor: "text-[#2a66b8]",
    },
  ];

  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[#2a66b8] text-2xl mb-4">TUTOR SCENE</p>
          <h2 className="text-4xl md:text-5xl text-[#2e3661] font-semibold mb-4">
            How to Get Started
          </h2>
          <p className="text-[#62698b] text-2xl">
            Start teaching in three simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <article
              key={step.id}
              className="bg-white rounded-2xl border border-black/10 p-8 text-center"
            >
              <div
                className={`w-20 h-20 mx-auto mb-6 rounded-full ${step.bgColor} flex items-center justify-center`}
              >
                <span className={`text-4xl font-normal ${step.textColor}`}>
                  {step.id}
                </span>
              </div>
              <h3 className="text-2xl text-[#101727] mb-4">{step.title}</h3>
              <p className="text-[#495565] text-lg">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../../../utils/api";

const steps = [
  {
    id: 1,
    title: "Create Your Profile",
    description:
      "Sign up and tell us about your expertise, experience, and teaching style.",
    circleClass: "bg-[#0f3e78]",
  },
  {
    id: 2,
    title: "Virtual Interview",
    description:
      "We are excited to get to know you through our virtual interview process.",
    circleClass: "bg-[#2a66b8]",
  },
  {
    id: 3,
    title: "Get Verified",
    description:
      "Complete our quick verification process to join our trusted tutor community.",
    circleClass: "bg-[#5b9fd4]",
  },
  {
    id: 4,
    title: "Start Tutoring",
    description:
      "Set your schedule, connect with learners, and start making an impact!",
    circleClass: "bg-brand-gold",
  },
];

export const WhyTeachSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated() && getCurrentUser()?.role === "tutor") {
      navigate("/create-profile");
      return;
    }
    navigate("/signup");
  };

  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl text-[#2e3661] font-semibold mb-4">
            How to Get Started
          </h2>
          <p className="text-[#62698b] text-xl md:text-2xl">
            Set the Scene in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          {steps.map((step) => (
            <article
              key={step.id}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 text-center flex flex-col items-center"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 mb-5 rounded-full ${step.circleClass} flex items-center justify-center shrink-0`}
              >
                <span className="text-3xl sm:text-4xl font-normal text-white">
                  {step.id}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl text-[#101727] font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-[#495565] text-sm sm:text-base leading-relaxed">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGetStarted}
            className="bg-brand-gold hover:bg-brand-dark-blue text-white px-8 py-3 rounded-md text-sm font-normal uppercase tracking-wide transition-all shadow-md hover:shadow-lg border-2 border-transparent hover:border-brand-gold"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
};

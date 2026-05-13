import { TutorOnboardingStepper } from "../TutorOnboardingStepper";
import { useTutorOnboardingNavigation } from "../../../hooks/useTutorOnboardingNavigation";

export const AvailabilitySection = () => {
  const step = "start";
  const { onStepClick } = useTutorOnboardingNavigation(step);

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
        <div className="mt-8 flex justify-center px-2">
          <TutorOnboardingStepper activeKey={step} onStepClick={onStepClick} />
        </div>
      </div>
    </section>
  );
};

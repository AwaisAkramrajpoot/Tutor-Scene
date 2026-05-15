export const TUTOR_ONBOARDING_STEPS = [
  { key: "create-profile", label: "Create Profile", path: "/create-profile" },
  { key: "interview", label: "Interview", path: "/interviews" },
  { key: "verify", label: "Get Verified", path: "/verify-identity" },
  { key: "start", label: "Start Tutoring", path: "/ready-to-teach" },
];

const circleBase =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-[background-color,color] duration-200 ease-out";

const labelBase =
  "whitespace-nowrap text-center text-xs transition-[color,opacity] duration-200 ease-out sm:text-sm";

export function TutorOnboardingStepper({ activeKey, onStepClick }) {
  const activeIndex = TUTOR_ONBOARDING_STEPS.findIndex((s) => s.key === activeKey);

  return (
    <div className="mx-auto w-fit max-w-4xl rounded-2xl bg-white/20 px-2 py-2 sm:px-3">
      <div className="flex w-fit items-center justify-center gap-1.5 sm:gap-2">
        {TUTOR_ONBOARDING_STEPS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onStepClick(index)}
              aria-current={isActive ? "step" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full px-1 py-2 transition-[background-color] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:gap-2 sm:px-1.5 ${
                isActive ? "bg-transparent" : "bg-transparent hover:bg-white/10"
              }`}
            >
              <div
                className={`${circleBase} ${
                  isActive ? "bg-white text-[#3D78BF]" : "bg-white/30 text-white"
                }`}
              >
                {index + 1}
              </div>
              <span
                title={item.label}
                className={`${labelBase} ${
                  isActive ? "font-medium text-white" : "font-normal text-white/75"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

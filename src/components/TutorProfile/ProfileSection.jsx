import React from "react";


export const ProfileInformationSection = () => {
  const steps = [
    { number: "1", label: "Create Profile", isActive: true },
    { number: "2", label: "Get Verified", isActive: false },
    { number: "3", label: "Start Teaching", isActive: false },
  ];

  return (
    <header className="flex w-[1903px] h-[560px] relative flex-col items-start pt-[118.94px] pb-0 px-[198.23px] bg-[linear-gradient(180deg,rgba(168,199,240,1)_0%,rgba(42,102,184,1)_100%)]">
      <div className="relative self-stretch w-full h-[322.12px]">
        <div className="absolute top-0 left-[672px] w-[163px] h-10 flex items-center bg-white rounded-[41571632px]">
          <div className="mt-[2.5px] h-[30px] ml-[25.2px] w-[115px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#2a66b8] text-base text-center tracking-[0] leading-[29.7px] whitespace-nowrap">
            TUTOR SCENE
          </div>
        </div>

        <div className="absolute top-[59px] left-px w-[1507px] h-[74px] flex">
          <h1 className="mt-[-7.4px] w-[778px] h-[75px] ml-[364.6px] [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[74.3px] text-center tracking-[0] leading-[74.3px] whitespace-nowrap">
            Build Your Tutor Profile.
          </h1>
        </div>

        <div className="absolute top-[164px] left-[278px] w-[952px] h-[69px] flex">
          <p className="mt-[-3.7px] w-[919.29px] h-[70px] ml-[16.7px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#daeafe] text-[24.8px] text-center tracking-[0] leading-[34.7px]">
            Share your experience, subjects, and a short intro video so students
            can get to know you.
          </p>
        </div>

        <nav
          className="absolute top-[253px] left-[441px] w-[625px] h-[69px] flex gap-[9.9px] bg-[#ffffff1a] rounded-[41571632px]"
          aria-label="Profile creation steps"
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div
                className={`flex mt-[14.9px] ${
                  step.number === "1"
                    ? "w-[167.47px]"
                    : step.number === "2"
                      ? "w-[151.83px]"
                      : "w-[172.27px]"
                } h-[39.65px] relative ${
                  step.number === "1" ? "ml-[29.7px]" : ""
                } items-center gap-[9.91px] ${
                  !step.isActive ? "opacity-50" : ""
                }`}
                aria-current={step.isActive ? "step" : undefined}
              >
                <div
                  className={`flex w-[39.65px] h-[39.65px] items-center justify-center relative ${
                    step.isActive ? "bg-white" : "bg-[#ffffff33]"
                  } rounded-[41571632px]`}
                >
                  <div className="relative w-[10.69px] h-[29.73px]">
                    <div
                      className={`absolute -top-0.5 ${
                        step.number === "1" ? "left-0" : "left-px"
                      } ${
                        step.isActive ? "text-[#2a66b8]" : "text-white"
                      } text-[19.8px] text-center leading-[29.7px] [font-family:'Arial-Regular',Helvetica] font-normal tracking-[0] whitespace-nowrap`}
                    >
                      {step.number}
                    </div>
                  </div>
                </div>

                <div className="relative flex-1 grow h-[29.73px]">
                  <div className="absolute -top-0.5 -left-px [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[19.8px] text-center tracking-[0] leading-[29.7px] whitespace-nowrap">
                    {step.label}
                  </div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className="mt-[19.8px] w-[17.11px] h-[29.73px] flex"
                  aria-hidden="true"
                >
                  <div className="mt-[-2.5px] w-5 h-[30px] ml-[-1.2px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#bddaff] text-[19.8px] text-center tracking-[0] leading-[29.7px] whitespace-nowrap">
                    →
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </header>
  );
};

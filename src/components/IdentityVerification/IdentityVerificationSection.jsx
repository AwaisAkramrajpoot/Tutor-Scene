import React from "react";
import icon from "./icon.svg";
import image from "./image.svg";
import nounEvent62618781 from "./noun-event-6261878-1.svg";

export const IdentityVerificationSection = () => {
  const navigationItems = [
    { label: "Home", active: true },
    { label: "Find Tutors", active: false },
    { label: "Become a Tutor", active: false },
    { label: "About", active: false },
  ];

  return (
    <header className="absolute top-px left-[calc(50.00%_-_950px)] w-[1902px] h-[102px]">
      <div className="absolute top-[-15px] left-0 w-[1901px] h-[132px] flex items-center">
        <div className="mt-[-1.0px] ml-[156px] w-[1590.25px] flex gap-[66px]">
          <div className="w-[1209.61px] flex gap-[39.6px]">
            <div className="w-[662.41px] h-[95.04px] flex">
              <div className="mt-[18.3px] w-[484.44px] h-[58.4px] ml-[178.0px] flex justify-center">
                <div className="flex w-[484.44px] relative flex-col items-start gap-[7.92px]">
                  <div className="flex flex-col items-start gap-[7.92px] relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex items-center gap-[10.56px] px-[18.48px] py-[13.2px] relative self-stretch w-full flex-[0_0_auto] bg-white rounded-[10.56px] overflow-hidden border-[1.32px] border-solid border-[#cfd4dc] shadow-[0px_1.32px_2.64px_#1018280d]">
                      <div className="flex items-center gap-[10.56px] relative flex-1 grow">
                        <div className="relative w-[26.4px] h-[26.4px]">
                          <img
                            className="absolute w-[75.00%] h-[75.00%] top-[12.50%] left-[12.50%]"
                            alt="Search icon"
                            src={icon}
                          />
                        </div>

                        <label
                          htmlFor="search-input"
                          className="relative flex-1 mt-[-1.32px] [font-family:'Inter-Regular',Helvetica] font-normal text-[#667084] text-[21.1px] tracking-[0] leading-[31.7px]"
                        >
                          Want to learn?
                        </label>

                        <input
                          id="search-input"
                          type="search"
                          className="sr-only"
                          aria-label="Search for learning topics"
                        />

                        <button
                          className="all-[unset] box-border inline-flex items-center justify-end absolute top-[calc(50.00%_-_23px)] left-[314px] rounded-[10.56px]"
                          aria-label="Explore learning topics"
                        >
                          <div className="inline-flex items-center justify-center gap-[10.56px] px-[21.12px] py-[10.56px] relative flex-[0_0_auto] bg-[#f2fffb] rounded-[10.56px] overflow-hidden">
                            <span className="relative w-fit mt-[-1.32px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#004d94] text-[18.5px] tracking-[0] leading-[26.4px] whitespace-nowrap">
                              Explore
                            </span>

                            <div className="relative w-[26.4px] h-[26.4px]">
                              <img
                                className="absolute w-[50.00%] h-[25.00%] top-[37.50%] left-[25.00%]"
                                alt=""
                                src={image}
                              />
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav
              className="mt-[31.5px] w-[507.6px] flex"
              aria-label="Main navigation"
            >
              {navigationItems.map((item, index) => (
                <a
                  key={item.label}
                  href={`#${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`mt-[-0.5px] h-8 ${index > 0 ? "ml-[39.6px]" : ""} ${
                    item.label === "Home"
                      ? "w-[61px]"
                      : item.label === "Find Tutors"
                        ? "w-[114px] ml-[39.6px]"
                        : item.label === "Become a Tutor"
                          ? "w-[159px] ml-[40.0px]"
                          : "w-[62px] ml-[40.0px]"
                  } ${
                    item.active
                      ? "[font-family:'Inter-SemiBold',Helvetica] font-semibold text-[#004d94]"
                      : "[font-family:'Inter-Medium',Helvetica] font-medium text-[#101828]"
                  } text-[21.1px] tracking-[0] leading-[31.7px] whitespace-nowrap`}
                  aria-current={item.active ? "page" : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="inline-flex mt-[20.8px] w-[314.64px] h-[53.4px] relative items-center justify-end gap-[26.4px]">
            <div className="relative w-[70px] h-8">
              <a
                href="#signin"
                className="absolute top-0 left-0 [font-family:'Inter-Medium',Helvetica] font-medium text-[#101828] text-[21.1px] tracking-[0] leading-[31.7px] whitespace-nowrap"
              >
                Sign in
              </a>
            </div>

            <button
              className="all-[unset] box-border inline-flex items-start relative flex-[0_0_auto] rounded-[10.56px]"
              aria-label="Create free account"
            >
              <div className="inline-flex items-center justify-center gap-[10.56px] px-[21.12px] py-[13.2px] relative flex-[0_0_auto] rounded-[10.56px] overflow-hidden border-[1.32px] border-solid border-[#20b486] shadow-[0px_0px_0px_5.28px_#f4ebff,0px_1.32px_2.64px_#1018280d] bg-[linear-gradient(99deg,rgba(71,166,226,1)_0%,rgba(0,77,148,1)_100%)]">
                <span className="relative w-fit mt-[-1.32px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-[18.5px] tracking-[0] leading-[26.4px] whitespace-nowrap">
                  Create free account
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <img
        className="absolute top-[calc(50.00%_-_49px)] left-[calc(50.00%_-_877px)] w-[97px] h-[97px]"
        alt="Tutoring platform logo"
        src={nounEvent62618781}
      />
    </header>
  );
};
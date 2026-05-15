import React from "react";

export function VerificationPageFooter() {
  return (
    <div className="mt-10 w-full rounded-xl bg-[#0f172a] px-6 py-6 text-center text-sm leading-relaxed text-white shadow-md">
      <p>This process typically takes 5-7 business days.</p>
      <p className="mt-2">After approval, you can begin the onboarding process.</p>
      <p className="mt-5">
        <a
          href="mailto:support@tutorscene.com"
          className="font-semibold text-white underline decoration-2 underline-offset-4 hover:text-sky-200"
        >
          Have Questions?
        </a>
      </p>
    </div>
  );
}

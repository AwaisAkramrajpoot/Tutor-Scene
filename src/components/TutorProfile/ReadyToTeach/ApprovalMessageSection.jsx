import React from "react";

export const ApprovalMessageSection = () => {
  return (
    <section className="w-full bg-green-50 border-b border-[#b8f7cf]" role="status" aria-live="polite">
      <div className="max-w-7xl mx-auto px-6 py-10 text-center">
        <div className="mx-auto w-20 h-20 flex items-center justify-center bg-[#00c950] rounded-full">
          <span className="text-white text-3xl">✓</span>
        </div>
        <h2 className="mt-6 text-3xl md:text-4xl text-[#101727]">Congratulations!</h2>
        <p className="mt-2 text-[#495565] text-lg">Your profile has been approved. You can now start accepting students and teaching sessions.</p>
      </div>
    </section>
  );
};

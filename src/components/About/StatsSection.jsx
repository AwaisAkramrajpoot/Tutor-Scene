import React from "react";

export const StatsSection = () => {
  const stats = [
    {
      value: "10K+",
      label: "Expert Tutors",
    },
    {
      value: "100K+",
      label: "Active Students",
    },
    {
      value: "500K+",
      label: "Sessions Completed",
    },
    {
      value: "150+",
      label: "Countries Reached",
    },
  ];

  return (
    <section className="w-full bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl md:text-5xl font-normal text-[#01519A] mb-2">
                {stat.value}
              </div>
              <div className="text-[#495565] text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

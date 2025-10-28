import React from "react";
import { BookingRequestsSection } from "./BookingRequestsSection";
import { DashboardStatsSection } from "./DashboardStatsSection";

export const TutorDashboard = () => {
  const statCards = [
    {
      title: "Total Earnings",
      value: "$3,240",
      subtitle: "+12% this month",
      gradient: "from-[#5A8DEE] to-[#5E60CE]",
      icon: "💵",
    },
    {
      title: "Sessions This Week",
      value: "18",
      subtitle: "6 pending requests",
      gradient: "from-[#FF5EA2] to-[#F06BC6]",
      icon: "📅",
    },
    {
      title: "Total Students",
      value: "127",
      subtitle: "Active students",
      gradient: "from-[#FFB000] to-[#FF8A00]",
      icon: "👥",
    },
    {
      title: "Hours Taught",
      value: "324",
      subtitle: "Total hours",
      gradient: "from-[#7A3CF8] to-[#C33BF9]",
      icon: "⏱️",
    },
  ];

  return (
    <div className="w-full bg-gray-50">
      <DashboardStatsSection />

      {/* Stat cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <article key={card.title} className={`rounded-2xl text-white p-6 relative overflow-hidden bg-gradient-to-r ${card.gradient}`}>
              <header className="flex items-center justify-between">
                <h3 className="text-lg opacity-95">{card.title}</h3>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">{card.icon}</div>
              </header>
              <div className="mt-6 text-3xl md:text-4xl font-normal">{card.value}</div>
              <div className="mt-2 text-white/80 text-sm">{card.subtitle}</div>
            </article>
          ))}
        </div>
      </div>

      {/* Main content */}
      <BookingRequestsSection />
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { BookingRequestsSection } from "./BookingRequestsSection";
import { DashboardStatsSection } from "./DashboardStatsSection";
import { apiRequest, getCurrentUser } from "../../../utils/api";

export const TutorDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const user = getCurrentUser();
        const tutorId = user?.id || user?.userId;
        
        if (!tutorId) {
          console.error('No tutor ID found');
          return;
        }

        const data = await apiRequest(`/api/v1/bookings/tutor/${tutorId}/statistics`);
        setStatistics(data);
      } catch (error) {
        console.error('Failed to fetch tutor statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const statCards = [
    {
      title: "Total Earnings",
      value: loading ? "..." : statistics?.totalEarnings ? `$${statistics.totalEarnings.toFixed(2)}` : "$0.00",
      subtitle: "+12% this month",
      gradient: "from-[#5A8DEE] to-[#5E60CE]",
      icon: "💵",
    },
    {
      title: "Sessions This Week",
      value: loading ? "..." : statistics?.currentWeekBookingsCount?.toString() || "0",
      subtitle: statistics?.pendingRequests ? `${statistics.pendingRequests} pending requests` : "No pending requests",
      gradient: "from-[#FF5EA2] to-[#F06BC6]",
      icon: "📅",
    },
    {
      title: "Total Students",
      value: loading ? "..." : statistics?.activeStudentsCount?.toString() || "0",
      subtitle: "Active students",
      gradient: "from-[#FFB000] to-[#FF8A00]",
      icon: "👥",
    },
    {
      title: "Hours Taught",
      value: loading ? "..." : statistics?.hoursTaught?.toString() || "0",
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

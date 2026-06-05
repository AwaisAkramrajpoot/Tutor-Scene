import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookingRequestsSection } from "./BookingRequestsSection";
import { DashboardStatsSection } from "./DashboardStatsSection";
import { TutorReferralsModal } from "./TutorReferralsModal";
import { apiRequest, getCurrentUser } from "../../../utils/api";
import { getTutorReferralSummary } from "../../../services/tutorReferralsService";

const EarningsIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12V6m0 12v-2" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LearnersIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ReferralsIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const StatCardShell = ({ title, icon: Icon, colorClass, children, onClick, to }) => {
  const content = (
    <>
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-medium opacity-95">{title}</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
          <Icon />
        </div>
      </header>
      {children}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`tutor-stat-card ${colorClass} w-full text-left`}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={`tutor-stat-card ${colorClass}`}>
      {content}
    </Link>
  );
};

export const TutorDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [referralSummary, setReferralSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralsOpen, setReferralsOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const user = getCurrentUser();
        const tutorId = user?.prospectId;

        if (!tutorId) {
          console.error('No tutor prospect ID found');
          return;
        }

        const [statsData, referralData] = await Promise.all([
          apiRequest(`/api/v1/bookings/tutor/${tutorId}/statistics`),
          getTutorReferralSummary().catch(() => null),
        ]);

        setStatistics(statsData);
        setReferralSummary(referralData);
      } catch (error) {
        console.error('Failed to fetch tutor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const weeklyEarnings = statistics?.weeklyEarnings ?? 0;
  const weeklySessions = statistics?.currentWeekBookingsCount ?? 0;
  const weeklyLearners = statistics?.weeklyLearnersCount ?? 0;

  return (
    <div className="w-full bg-gray-50">
      <DashboardStatsSection />

      <div className="max-w-7xl mx-auto px-6 -mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardShell
            title="Total Weekly Earnings"
            icon={EarningsIcon}
            colorClass="tutor-stat-card--navy"
            to="/tutor/wallet"
          >
            <div className="mt-6 text-3xl md:text-4xl font-normal">
              {loading ? '...' : `$${Number(weeklyEarnings).toFixed(2)}`}
            </div>
          </StatCardShell>

          <StatCardShell
            title="Sessions This Week"
            icon={CalendarIcon}
            colorClass="tutor-stat-card--medium-blue"
            to="/tutor/availability"
          >
            <div className="mt-6 text-3xl md:text-4xl font-normal">
              {loading ? '...' : weeklySessions}
            </div>
          </StatCardShell>

          <StatCardShell
            title="Total Weekly Learners"
            icon={LearnersIcon}
            colorClass="tutor-stat-card--light-blue"
            to="/tutor/session-history"
          >
            <div className="mt-6 text-3xl md:text-4xl font-normal">
              {loading ? '...' : weeklyLearners}
            </div>
          </StatCardShell>

          <StatCardShell
            title="Referrals"
            icon={ReferralsIcon}
            colorClass="tutor-stat-card--gold"
            onClick={() => setReferralsOpen(true)}
          >
            <div className="mt-5 space-y-1 text-sm md:text-base">
              <p>
                <span className="opacity-90">Code:</span>{' '}
                <span className="font-semibold">{loading ? '...' : referralSummary?.referralCode || '—'}</span>
              </p>
              <p>
                <span className="opacity-90"># Referrals:</span>{' '}
                <span className="font-semibold">{loading ? '...' : referralSummary?.totalReferrals ?? 0}</span>
              </p>
              <p>
                <span className="opacity-90">Referrals Completed:</span>{' '}
                <span className="font-semibold">{loading ? '...' : referralSummary?.referralsCompleted ?? 0}</span>
              </p>
            </div>
          </StatCardShell>
        </div>
      </div>

      <BookingRequestsSection />
      <TutorReferralsModal open={referralsOpen} onClose={() => setReferralsOpen(false)} />
    </div>
  );
};

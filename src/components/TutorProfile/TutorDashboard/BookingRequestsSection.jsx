import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../utils/api";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import NotificationsPanel from "../../Notifications/NotificationsPanel";
import AutoAcceptBookingToggle from "../../tutor/AutoAcceptBookingToggle";
import BookingRequestDetailModal from "../../tutor/BookingRequestDetailModal";
import TutorSessionDetailModal from "../../tutor/TutorSessionDetailModal";
import { showSystemMessage } from '../../../utils/systemMessage';

const UPCOMING_FILTER_OPTIONS = [
  { id: 'count-5', label: 'Next 5 sessions', viewMode: 'count', limit: 5 },
  { id: 'count-10', label: 'Next 10 sessions', viewMode: 'count', limit: 10 },
  { id: 'period-week', label: 'Sessions this week', viewMode: 'period', period: 'week', limit: 50 },
  { id: 'period-month', label: 'Sessions this month', viewMode: 'period', period: 'month', limit: 50 },
  { id: 'period-3months', label: 'Sessions next 3 months', viewMode: 'period', period: '3months', limit: 100 },
];

const formatBookingDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatBookingTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const applyUpcomingFilter = (sessions, filterId) => {
  const config =
    UPCOMING_FILTER_OPTIONS.find((o) => o.id === filterId) ||
    UPCOMING_FILTER_OPTIONS[0];
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime),
  );

  if (config.viewMode === 'count') {
    return sorted.slice(0, config.limit);
  }

  const now = new Date();
  const end = new Date(now);
  if (config.period === 'week') {
    end.setDate(end.getDate() + 7);
  } else if (config.period === 'month') {
    end.setMonth(end.getMonth() + 1);
  } else if (config.period === '3months') {
    end.setMonth(end.getMonth() + 3);
  }

  return sorted.filter((session) => {
    const start = new Date(session.startTime);
    return start > now && start <= end;
  });
};

const renderStars = (score) => {
  return [1, 2, 3, 4, 5].map((i) => {
    const filled = score >= i;
    const half = !filled && score >= i - 0.5;
    return (
      <svg
        key={i}
        className={`w-4 h-4 inline-block ${filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );
  });
};

export const BookingRequestsSection = () => {
  const navigate = useNavigate();
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingActionLoading, setBookingActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for tutor sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  // State for ratings
  const [ratings, setRatings] = useState(null);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  // Complete booking dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState(null);
  const [completingBooking, setCompletingBooking] = useState(false);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(null);
  const [prospectId, setProspectId] = useState(null);
  const [detailBookingId, setDetailBookingId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sessionDetailId, setSessionDetailId] = useState(null);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [upcomingFilter, setUpcomingFilter] = useState('count-5');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const fetchTutorRatings = useCallback(async (tutorId) => {
    try {
      setLoadingRatings(true);
      const data = await apiRequest(`/api/v1/bookings/tutor/${tutorId}/ratings`);
      setRatings(data);
    } catch (err) {
      console.error('Failed to fetch tutor ratings:', err);
    } finally {
      setLoadingRatings(false);
    }
  }, []);

  const fetchBookingRequests = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const tutorId = user.prospectId;
      setProspectId(tutorId || null);

      if (!tutorId) return;

      setLoadingBookings(true);
      const data = await apiRequest(`/api/v1/bookings/pending-review/tutor/${tutorId}`);
      setBookingRequests(Array.isArray(data) ? data : data.bookings || data.data || []);
      fetchTutorRatings(tutorId);
    } catch (err) {
      console.error('Failed to fetch booking requests:', err);
      setError('Failed to load booking requests');
    } finally {
      setLoadingBookings(false);
    }
  }, [fetchTutorRatings]);

  const fetchTutorSessions = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setSessionsError('User not found. Please log in again.');
        return;
      }

      const user = JSON.parse(userStr);
      const tutorId = user.prospectId;
      if (!tutorId) {
        setSessionsError('Tutor ID not found. Please log in again.');
        return;
      }

      setLoadingSessions(true);
      setSessionsError(null);

      const data = await apiRequest(
        `/api/v1/bookings/tutor/${tutorId}/sessions?status=upcoming&limit=100&page=1`,
      );

      const sessionsArray = Array.isArray(data) ? data : data.data || data.sessions || [];
      setSessions(applyUpcomingFilter(sessionsArray, upcomingFilter));
    } catch (err) {
      console.error('Failed to fetch tutor sessions:', err);
      setSessionsError(err.message || 'Unable to load sessions. Please try again later.');
    } finally {
      setLoadingSessions(false);
    }
  }, [upcomingFilter]);

  const handleAutoAcceptChange = useCallback((enabled) => {
    setAutoAcceptEnabled(enabled);
    if (enabled) {
      setBookingRequests([]);
      setLoadingBookings(false);
    } else {
      fetchBookingRequests();
    }
    fetchTutorSessions();
  }, [fetchBookingRequests, fetchTutorSessions]);

  useEffect(() => {
    fetchTutorSessions();
    fetchBookingRequests();
  }, [fetchTutorSessions, fetchBookingRequests]);

  const handleAcceptBooking = async (bookingId) => {
    try {
      setBookingActionLoading(bookingId);
      setError(null);
      
      // Get prospectId from localStorage
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);
      const prospectId = user.prospectId;

      await apiRequest(`/api/v1/bookings/${bookingId}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ prospectId })
      });

      // Remove accepted booking from list
      setBookingRequests(prev => prev.filter(booking => booking.id !== bookingId));
      setSuccessMessage('Booking request accepted successfully!');
      fetchTutorSessions();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to accept booking:', err);
      setError(err.message || 'Failed to accept booking request');
    } finally {
      setBookingActionLoading(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setBookingActionLoading(bookingId);
      setError(null);
      
      // Get prospectId from localStorage
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);
      const prospectId = user.prospectId;

      await apiRequest(`/api/v1/bookings/${bookingId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ prospectId })
      });

      // Remove rejected booking from list
      setBookingRequests(prev => prev.filter(booking => booking.id !== bookingId));
      setSuccessMessage('Booking request rejected successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to reject booking:', err);
      setError(err.message || 'Failed to reject booking request');
    } finally {
      setBookingActionLoading(null);
    }
  };

  const handleOpenCancelDialog = (session) => {
    setSessionToCancel(session);
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSessionToCancel(null);
  };

  const handleCancelBooking = async () => {
    if (!sessionToCancel) return;

    setCancellingBooking(true);

    try {
      await apiRequest(`/api/v1/bookings/${sessionToCancel.id}/cancel`, {
        method: 'PATCH'
      });

      // Remove cancelled session from list
      setSessions(prevSessions =>
        prevSessions.filter(s => s.id !== sessionToCancel.id)
      );
      fetchTutorSessions();

      setSuccessMessage('Booking cancelled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      handleCloseCancelDialog();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBooking(false);
    }
  };

  const handleOpenCompleteDialog = (session) => {
    setSessionToComplete(session);
    setCompleteDialogOpen(true);
  };

  const handleCloseCompleteDialog = () => {
    setCompleteDialogOpen(false);
    setSessionToComplete(null);
  };

  const handleCompleteBooking = async () => {
    if (!sessionToComplete) return;

    setCompletingBooking(true);

    try {
      await apiRequest(`/api/v1/bookings/${sessionToComplete.id}/complete`, {
        method: 'PATCH'
      });

      // Remove completed session from list
      setSessions(prevSessions =>
        prevSessions.filter(s => s.id !== sessionToComplete.id)
      );
      fetchTutorSessions();

      setSuccessMessage('Booking marked as completed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      handleCloseCompleteDialog();
    } catch (err) {
      console.error('Failed to complete booking:', err);
      setError(err.message || 'Failed to mark booking as completed. Please try again.');
    } finally {
      setCompletingBooking(false);
    }
  };

  const earningsPeriods = [
    {
      period: "This Week",
      amount: "$540",
      sessions: "12",
    },
    {
      period: "This Month",
      amount: "$3,240",
      sessions: "72",
    },
  ];



  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <div 
            onClick={() => navigate('/messages')}
            className="rounded-2xl p-4 bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl">💬</div>
              <div>
                <h3 className="text-lg font-normal">Messages</h3>
                <p className="text-white/80 text-sm">Chat with your students</p>
              </div>
            </div>
          </div>

          {/* New Booking Requests */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <h2 className="text-2xl text-[#101727]">New Booking Requests</h2>
              </div>
              <AutoAcceptBookingToggle onChange={handleAutoAcceptChange} />
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Tutors are required to Accept or Decline a request within 72 hours of receipt.
              If no action is taken, the request will be automatically declined unless you opt in
              to Automatically Accept Booking Requests.
            </p>

            {autoAcceptEnabled === null || loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                <span className="ml-3 text-gray-600">Loading booking requests...</span>
              </div>
            ) : autoAcceptEnabled ? (
              <p className="text-sm text-gray-500 py-4 border-t border-gray-100">
                New booking requests are automatically accepted and appear in Upcoming Sessions below.
              </p>
            ) : bookingRequests.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No pending booking requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-xl p-5">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailBookingId(request.id);
                        setDetailOpen(true);
                      }}
                      className="text-xl text-brand-medium-blue hover:underline font-medium"
                    >
                      {request?.student?.firstName || 'Learner'}
                    </button>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[#495565]">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">📅</span>
                        <time dateTime={request.startTime}>
                          {formatBookingDate(request.startTime)}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">🕐</span>
                        <time dateTime={request.startTime}>
                          {formatBookingTime(request.startTime)}
                        </time>
                        <span>–</span>
                        <time dateTime={request.endTime}>
                          {formatBookingTime(request.endTime)}
                        </time>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-4">
                      <button
                        type="button"
                        onClick={() => handleAcceptBooking(request.id)}
                        disabled={bookingActionLoading === request.id}
                        className="flex-1 bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookingActionLoading === request.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectBooking(request.id)}
                        disabled={bookingActionLoading === request.id}
                        className="flex-1 bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookingActionLoading === request.id ? 'Processing...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Upcoming Sessions */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">📅</span>
                <div>
                  <h2 className="text-2xl text-[#101727]">Upcoming Sessions</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select an appointment to view details
                  </p>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterMenuOpen((o) => !o)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Filters ▾
                </button>
                {filterMenuOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {UPCOMING_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setUpcomingFilter(opt.id);
                          setFilterMenuOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          upcomingFilter === opt.id ? 'text-brand-medium-blue font-medium' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Showing: {UPCOMING_FILTER_OPTIONS.find((o) => o.id === upcomingFilter)?.label}
            </p>

            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                <span className="ml-3 text-gray-600">Loading sessions...</span>
              </div>
            ) : sessionsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{sessionsError}</p>
                <button
                  type="button"
                  onClick={fetchTutorSessions}
                  className="mt-2 text-red-600 underline hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No upcoming sessions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center gap-4 px-4 py-4 bg-white hover:bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSessionDetailId(session.id);
                        setSessionDetailOpen(true);
                      }}
                      className="text-lg text-brand-medium-blue hover:underline font-medium min-w-[100px] text-left"
                    >
                      {session?.student?.firstName || 'Learner'}
                    </button>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[#495565] text-sm flex-1">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">📅</span>
                        <time dateTime={session.startTime}>
                          {formatBookingDate(session.startTime)}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">🕐</span>
                        <time dateTime={session.startTime}>
                          {formatBookingTime(session.startTime)}
                        </time>
                        <span>–</span>
                        <time dateTime={session.endTime}>
                          {formatBookingTime(session.endTime)}
                        </time>
                      </div>
                      {session.status === 'pending' && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Awaiting payment
                        </span>
                      )}
                    </div>
                    {session.status === 'confirmed' && session.hostStartUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(session.hostStartUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-sm text-brand-medium-blue hover:underline whitespace-nowrap"
                      >
                        Start Session
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Earnings Overview */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">Earnings Overview</h2>
            <div className="space-y-4">
              {earningsPeriods.map((period, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[#495565] text-lg">{period.period}</p>
                    <p className="text-[#101727] text-3xl mt-1">{period.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#495565] text-lg">Sessions</p>
                    <p className="text-[#101727] text-2xl mt-1">{period.sessions}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Right column - 1/3 width */}
        <aside className="space-y-6">
          {/* Notifications */}
          <NotificationsPanel showStripeButton />

          {/* Quick Actions */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">Quick Actions</h2>
            <nav className="space-y-3">
              <button
                onClick={() => navigate('/tutor/availability')}
                className="w-full bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Manage Availability
              </button>
              <button
                onClick={() => navigate('/tutor/profile')}
                className="w-full bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Update Profile
              </button>
            </nav>
          </article>

          {/* Ratings */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-1">Ratings</h2>
            {ratings && (
              <p className="text-xs text-gray-400 mb-5">
                Based on past {ratings.ratingPeriodMonths} month{ratings.ratingPeriodMonths !== 1 ? 's' : ''}
              </p>
            )}
            {loadingRatings ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-medium-blue"></div>
              </div>
            ) : ratings ? (
              <div className="space-y-5">
                {/* Satisfaction Rate */}
                <div>
                  <p className="text-[#495565] text-sm mb-1">Satisfaction Rate</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#101727] text-2xl font-semibold">
                      {ratings.satisfactionRate.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">/ 5</span>
                    <span className="flex gap-0.5 ml-1">
                      {renderStars(ratings.satisfactionRate)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ratings.totalReviews} review{ratings.totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Acceptance Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#495565] text-sm">Acceptance Rate</p>
                    <p className="text-[#101727] text-lg font-semibold">{ratings.acceptanceRate}%</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#47A6E2] to-[#004D94]"
                      style={{ width: `${ratings.acceptanceRate}%` }}
                    />
                  </div>
                </div>

                {/* Cancellation Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[#495565] text-sm">Cancellation Rate</p>
                    <p className="text-[#101727] text-lg font-semibold">{ratings.cancellationRate}%</p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{ width: `${ratings.cancellationRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4">No ratings data available.</p>
            )}
          </article>
        </aside>
      </div>

      <BookingRequestDetailModal
        open={detailOpen}
        bookingId={detailBookingId}
        prospectId={prospectId}
        onClose={() => {
          setDetailOpen(false);
          setDetailBookingId(null);
        }}
      />

      <TutorSessionDetailModal
        open={sessionDetailOpen}
        bookingId={sessionDetailId}
        prospectId={prospectId}
        onClose={() => {
          setSessionDetailOpen(false);
          setSessionDetailId(null);
        }}
        onCancelSession={(session) => {
          setSessionDetailOpen(false);
          setSessionDetailId(null);
          handleOpenCancelDialog(session);
        }}
      />

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">Cancel Booking</span>
            <button
              onClick={handleCloseCancelDialog}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={cancellingBooking}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Are you sure you want to proceed with this action?
            </h3>
            <p className="text-gray-600 text-center text-sm">
              This will cancel your session with {sessionToCancel?.student?.firstName} {sessionToCancel?.student?.lastName}. This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={handleCloseCancelDialog}
            color="inherit"
            disabled={cancellingBooking}
          >
            No, Keep Booking
          </Button>
          <Button
            onClick={handleCancelBooking}
            variant="contained"
            color="error"
            disabled={cancellingBooking}
          >
            {cancellingBooking ? 'Cancelling...' : 'Yes, Cancel Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Booking Confirmation Dialog */}
      <Dialog
        open={completeDialogOpen}
        onClose={handleCloseCompleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">Mark Booking as Completed</span>
            <button
              onClick={handleCloseCompleteDialog}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={completingBooking}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Mark this session as completed?
            </h3>
            <p className="text-gray-600 text-center text-sm">
              This will mark your session with {sessionToComplete?.student?.firstName} {sessionToComplete?.student?.lastName} as completed. This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={handleCloseCompleteDialog}
            color="inherit"
            disabled={completingBooking}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteBooking}
            variant="contained"
            sx={{ 
              backgroundColor: '#16a34a',
              '&:hover': {
                backgroundColor: '#15803d'
              }
            }}
            disabled={completingBooking}
          >
            {completingBooking ? 'Marking as Completed...' : 'Yes, Mark as Completed'}
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

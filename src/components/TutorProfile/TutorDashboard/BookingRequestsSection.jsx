import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../utils/api";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import NotificationsPanel from "../../Notifications/NotificationsPanel";

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

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  // Complete booking dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState(null);
  const [completingBooking, setCompletingBooking] = useState(false);

  // Fetch booking requests on component mount
  useEffect(() => {
    const fetchBookingRequests = async () => {
      try {
        // Get tutor ID from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        const tutorId = user.prospectId;

        if (!tutorId) return;

        setLoadingBookings(true);
        const data = await apiRequest(`/api/v1/bookings/pending-review/tutor/${tutorId}`);
        setBookingRequests(Array.isArray(data) ? data : data.bookings || data.data || []);
      } catch (err) {
        console.error('Failed to fetch booking requests:', err);
        setError('Failed to load booking requests');
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookingRequests();
  }, []);

  // Fetch tutor sessions on component mount
  useEffect(() => {
    const fetchTutorSessions = async () => {
      try {
        // Get tutor ID from localStorage
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
        
        const data = await apiRequest(`/api/v1/bookings/tutor/${tutorId}/sessions?status=upcoming`);
        
        // Extract sessions array from response
        const sessionsArray = Array.isArray(data) ? data : data.sessions || data.data || [];
        setSessions(sessionsArray);
      } catch (err) {
        console.error('Failed to fetch tutor sessions:', err);
        setSessionsError(err.message || 'Unable to load sessions. Please try again later.');
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchTutorSessions();
  }, []);

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

      // Clear success message after 3 seconds
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



  const performanceMetrics = [
    {
      label: "Response Rate",
      value: "98%",
      percentage: 98,
    },
    {
      label: "Completion Rate",
      value: "95%",
      percentage: 95,
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
            <h2 className="text-2xl text-[#101727] mb-6">New Booking Requests</h2>

            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                <span className="ml-3 text-gray-600">Loading booking requests...</span>
              </div>
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
                    <h3 className="text-xl text-[#101727]">
                      {request?.student?.firstName || 'Unknown'} {request?.student?.lastName || 'Student'}
                    </h3>
                    {request.subject && (
                      <div className="mt-2 inline-flex items-center bg-purple-50 text-[#6a3de8] px-3 py-1 rounded-lg text-sm border border-transparent">
                        {typeof request.subject === 'object' && request.subject?.name ? request.subject.name : request.subject}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-[#495565]">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <time>
                          {new Date(request.startTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <time>
                          {new Date(request.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </time>
                      </div>
                    </div>
                    {request.notes && (
                      <p className="mt-3 text-sm text-gray-600">
                        <strong>Notes:</strong> {request.notes}
                      </p>
                    )}
                    <div className="mt-4 flex gap-4">
                      <button
                        onClick={() => handleAcceptBooking(request.id)}
                        disabled={bookingActionLoading === request.id}
                        className="flex-1 bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bookingActionLoading === request.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
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
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">📅</span>
              <h2 className="text-2xl text-[#101727]">Upcoming Sessions</h2>
            </div>
            
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                <span className="ml-3 text-gray-600">Loading sessions...</span>
              </div>
            ) : sessionsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{sessionsError}</p>
                <button 
                  onClick={() => window.location.reload()} 
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
              <div className="space-y-4">
                {sessions.map((session) => {
                  // Handle both object and string formats for subject
                  const subjectName = typeof session.subject === 'object' && session.subject
                    ? session.subject.name 
                    : session.subject;
                  
                  // Format date and time
                  const sessionDate = new Date(session.startTime);
                  const formattedDate = sessionDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });
                  const formattedTime = sessionDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  return (
                    <div key={session.id} className="bg-gray-50 rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-xl text-[#101727]">
                          {session?.student?.firstName || 'Unknown'} {session?.student?.lastName || 'Student'}
                        </h3>
                        {subjectName && (
                          <div className="mt-2 inline-flex items-center bg-purple-50 text-[#6a3de8] px-3 py-1 rounded-lg text-sm border border-transparent">
                            {subjectName}
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-4 text-[#495565]">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <time>{formattedDate}</time>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <time>{formattedTime}</time>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <button 
                          onClick={() => {
                            if (session.zoomJoinLink) {
                              window.open(session.hostStartUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              alert('Zoom link not available for this session');
                            }
                          }}
                          className="bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          Start Session
                        </button>
                        <button
                          onClick={() => handleOpenCompleteDialog(session)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Mark as Completed
                        </button>
                        {session.status === 'confirmed' && (
                          <button
                            onClick={() => handleOpenCancelDialog(session)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
          <NotificationsPanel />

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
              <button className="w-full bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Update Profile
              </button>
              <button className="w-full bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                View Analytics
              </button>
            </nav>
          </article>

          {/* Performance */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">Performance</h2>
            <div className="space-y-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#495565] text-lg">{metric.label}</p>
                    <p className="text-[#101727] text-lg font-medium">{metric.value}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#47A6E2] to-[#004D94]"
                      style={{ width: `${metric.percentage}%` }}
                      role="progressbar"
                      aria-valuenow={metric.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${metric.label}: ${metric.value}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>

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

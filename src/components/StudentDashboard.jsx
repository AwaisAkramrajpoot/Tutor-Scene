import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

// Icons
const SearchIcon = (props) => (
  <svg {...props} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BookIcon = (props) => (
  <svg {...props} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L19.5 4.5M15 17h5l-5 5v-5z" />
  </svg>
);

const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentTutors, setRecentTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [error, setError] = useState(null);
  const [tutorsError, setTutorsError] = useState(null);
  const [user, setUser] = useState(null);

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await apiRequest(
          `/api/v1/bookings/student/${user.id}/sessions?status=upcoming`,
          'GET'
        );
        setUpcomingSessions(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching upcoming sessions:', err);
        setError('Failed to load upcoming sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingSessions();
  }, [user?.id]);

  useEffect(() => {
    const fetchRecentTutors = async () => {
      if (!user?.id) return;

      try {
        setLoadingTutors(true);
        const response = await apiRequest(
          `/api/v1/conversations/student/${user.id}/recent-tutors`,
          'GET'
        );
        setRecentTutors(response.data || response || []);
        setTutorsError(null);
      } catch (err) {
        console.error('Error fetching recent tutors:', err);
        setTutorsError('Failed to load recent tutors');
      } finally {
        setLoadingTutors(false);
      }
    };

    fetchRecentTutors();
  }, [user?.id]);

  const handleJoinSession = (zoomLink) => {
    if (zoomLink) {
      window.open(zoomLink, '_blank');
    } else {
      alert('Zoom link not available for this session');
    }
  };

  const handleViewInChat = () => {
    navigate('/messages');
  };

  const handleFindTutors = () => {
    navigate('/find-tutors');
  };

  const handleMySessions = () => {
    navigate('/my-sessions');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
      setUpcomingSessions(prevSessions =>
        prevSessions.filter(s => s.id !== sessionToCancel.id)
      );

      handleCloseCancelDialog();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert(err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome Back, {user?.firstName || 'Student'}!
          </h1>
          <p className="text-xl text-brand-light-blue">Ready to continue your learning journey?</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Find New Tutor Card */}
              <div 
                onClick={handleFindTutors}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center border-2 border-brand-gold">
                    <SearchIcon className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Find New Tutor</h3>
                    <p className="text-gray-600">Browse tutors</p>
                  </div>
                </div>
              </div>

              {/* My Sessions Card */}
              <div 
                onClick={handleMySessions}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center border-2 border-brand-gold">
                    <BookIcon className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">My Sessions</h3>
                    <p className="text-gray-600">View history</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CalendarIcon className="text-brand-medium-blue" />
                <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No upcoming sessions scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={session.tutor?.profilePicture || `https://placehold.co/48x48/E0E0E0/333333?text=${session.tutor?.firstName?.[0] || 'T'}${session.tutor?.lastName?.[0] || 'T'}`}
                          alt={`${session.tutor?.fullName || ''}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {session.tutor?.fullName}
                          </h3>
                          {session.subject && (
                            <div className="flex space-x-2 mt-1">
                              <span className="bg-brand-light-blue text-brand-dark-blue px-2 py-1 rounded-full text-xs font-medium">
                                {session.subject.name || session.subject}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(session.startTime)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{formatTime(session.endTime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleJoinSession(session.zoomJoinLink)}
                          className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                          Join Session
                        </button>
                        {session.status === 'confirmed' && (
                          <button
                            onClick={() => handleOpenCancelDialog(session)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            title="Cancel Booking"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Tutors Contacted */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Tutors Contacted</h2>
              
              {loadingTutors ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                </div>
              ) : tutorsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{tutorsError}</p>
                </div>
              ) : recentTutors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent tutors contacted</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTutors.map((item) => {
                    const tutorInfo = item.tutor || {};
                    const prospectInfo = item.prospectInfo || {};
                    const subjects = prospectInfo.subjects ? prospectInfo.subjects.split(', ') : [];
                    
                    return (
                      <div key={item.tutorId || item.conversationId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={prospectInfo.profilePic || tutorInfo.profilePhotoUrl || `https://placehold.co/48x48/E0E0E0/333333?text=${tutorInfo.firstName?.[0] || 'T'}${tutorInfo.lastName?.[0] || 'T'}`}
                            alt={`${tutorInfo.firstName} ${tutorInfo.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {prospectInfo.fullName || `${tutorInfo.firstName} ${tutorInfo.lastName}`}
                            </h3>
                            {prospectInfo.yearsOfExperience && (
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-600">
                                  {prospectInfo.yearsOfExperience} years experience
                                </span>
                              </div>
                            )}
                            {subjects.length > 0 && (
                              <div className="flex space-x-2 mt-2 flex-wrap">
                                {subjects.slice(0, 2).map((subject, index) => (
                                  <span key={index} className="bg-brand-light-blue text-brand-dark-blue px-2 py-1 rounded-full text-xs font-medium">
                                    {subject.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={handleViewInChat}
                          className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                          View in Chat
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BellIcon className="text-brand-medium-blue" />
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              </div>

              {/* Today Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">TODAY</h3>
                  <button className="text-sm text-gray-500 hover:text-gray-700">Mark all as read</button>
                </div>
                
                <div className="space-y-4">
                  {/* Notification 1 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">New Session Booked</h4>
                        <span className="text-xs text-gray-500">1h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Your session with Sarah Mitchell starts in 2 hours</p>
                    </div>
                  </div>

                  {/* Notification 2 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">Session Completed</h4>
                        <span className="text-xs text-gray-500">2h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">You've successfully completed your recent Science lesson with Ahmed</p>
                    </div>
                  </div>

                  {/* Notification 3 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">Session Rescheduled</h4>
                        <span className="text-xs text-gray-500">8h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Fatima Noor has rescheduled her English session to Saturday, 7:00 PM.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yesterday Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">YESTERDAY</h3>
                  <button className="text-sm text-gray-500 hover:text-gray-700">Mark all as read</button>
                </div>
                
                <div className="space-y-4">
                  {/* Notification 1 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">Upcoming Session Reminder</h4>
                        <span className="text-xs text-gray-500">1d</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">You have a Physics session with Ahsan Malik scheduled for tomorrow at 6:30 PM.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
              This will cancel your booking with {sessionToCancel?.tutor?.fullName}. This action cannot be undone.
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
    </div>
  );
};

export default StudentDashboard;

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest, resolveApiAssetUrl } from '../utils/api';
import { getStudentProfileId } from '../utils/authUserIds';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Rating } from '@mui/material';
import { showSystemMessage } from '../utils/systemMessage';

// Icons
const SearchIcon = (props) => (
  <svg {...props} className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = (props) => (
  <svg {...props} className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const MySessions = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'cancelled' || tab === 'completed' ? tab : 'upcoming';
  });
  const [highlightSessionId, setHighlightSessionId] = useState(() => {
    const id = searchParams.get('session');
    return id ? parseInt(id, 10) : null;
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Fetch sessions when tab or page changes
  useEffect(() => {
    fetchSessions();
  }, [activeTab, currentPage]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upcoming' || tab === 'cancelled' || tab === 'completed') {
      setActiveTab(tab);
    }
    const sessionId = searchParams.get('session');
    setHighlightSessionId(sessionId ? parseInt(sessionId, 10) : null);
  }, [searchParams]);

  useEffect(() => {
    if (!highlightSessionId || loading || sessions.length === 0) return;
    const el = document.getElementById(`session-${highlightSessionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightSessionId, loading, sessions]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentId = getStudentProfileId();

      if (!studentId) {
        setError('Student ID not found. Please log in again.');
        return;
      }

      const response = await apiRequest(
        `/api/v1/bookings/student/${studentId}/sessions?status=${activeTab}&page=${currentPage}&limit=${limit}`,
        { method: 'GET' },
      );

      setSessions(response.data || []);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery('');
    setSubjectFilter('');
    setSortOrder('newest');
    setFilterOpen(false);
    setHighlightSessionId(null);
    setSearchParams(tab === 'upcoming' ? { tab } : { tab });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOpenReviewDialog = (session) => {
    setSelectedSession(session);
    setReviewRating(0);
    setReviewComment('');
    setReviewError(null);
    setReviewSuccess(false);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedSession(null);
    setReviewRating(0);
    setReviewComment('');
    setReviewError(null);
    setReviewSuccess(false);
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

      // Remove cancelled session from list or update its status
      setSessions(prevSessions =>
        prevSessions.filter(s => s.id !== sessionToCancel.id)
      );

      handleCloseCancelDialog();

      // Refresh sessions list
      fetchSessions();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      showSystemMessage({ message: err.message || 'Failed to cancel booking. Please try again.', type: 'error' });
    } finally {
      setCancellingBooking(false);
    }
  };

  const handleSubmitReview = async () => {
    // Validation
    if (reviewRating === 0) {
      setReviewError('Please select a rating');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError('Please write a comment');
      return;
    }

    if (reviewComment.trim().length < 10) {
      setReviewError('Comment must be at least 10 characters long');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      // Get student profile ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setReviewError('User not found. Please log in again.');
        setSubmittingReview(false);
        return;
      }

      const user = JSON.parse(userStr);
      const studentProfileId = user.id || user.userId;

      if (!studentProfileId) {
        setReviewError('Student profile ID not found. Please log in again.');
        setSubmittingReview(false);
        return;
      }

      const payload = {
        bookingId: selectedSession.id,
        tutorProfileId: selectedSession.tutorProfileId,
        studentProfileId: studentProfileId,
        rating: reviewRating,
        comment: reviewComment.trim()
      };

      await apiRequest('/api/v1/reviews', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update the session in the list to mark review as added
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.id === selectedSession.id
            ? { ...s, reviewAdded: true }
            : s
        )
      );

      // Show success message
      setReviewSuccess(true);

      // Close dialog after 2 seconds
      setTimeout(() => {
        handleCloseReviewDialog();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-brand-light-blue text-brand-dark-blue border border-brand-gold',
      confirmed: 'bg-brand-light-blue text-brand-dark-blue border border-brand-gold',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getLearnerFirstName = (session) => {
    if (session.learnerLabel) {
      return session.learnerLabel.trim().split(/\s+/)[0];
    }
    return session.student?.firstName || 'Learner';
  };

  const getTutorFirstName = (session) => {
    const tutor = session.tutor;
    if (!tutor) return 'Tutor';
    if (tutor.user?.firstName) return tutor.user.firstName;
    if (tutor.fullName) return tutor.fullName.trim().split(/\s+/)[0];
    return 'Tutor';
  };

  const getTutorProfilePic = (session) => {
    const pic = session.tutor?.profilePic;
    if (pic) return resolveApiAssetUrl(pic);
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const startStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const endStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${startStr} - ${endStr}`;
  };

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.round(diffMs / (1000 * 60));
      return `${diffMins} min`;
    }

    return `${diffHours.toFixed(1)} hour${diffHours > 1 ? 's' : ''}`;
  };

  const subjectOptions = useMemo(() => {
    const names = sessions
      .map((s) => s.subject?.name)
      .filter(Boolean);
    return [...new Set(names)].sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    let list = [...sessions];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((session) => {
        const tutorName = session.tutor?.fullName || '';
        const subjectName = session.subject?.name || '';
        const dateStr = formatDate(session.startTime);
        return (
          tutorName.toLowerCase().includes(q) ||
          subjectName.toLowerCase().includes(q) ||
          dateStr.toLowerCase().includes(q) ||
          (session.status || '').toLowerCase().includes(q)
        );
      });
    }

    if (subjectFilter) {
      list = list.filter((session) => session.subject?.name === subjectFilter);
    }

    list.sort((a, b) => {
      const aTime = new Date(a.startTime).getTime();
      const bTime = new Date(b.startTime).getTime();
      return sortOrder === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return list;
  }, [sessions, searchQuery, subjectFilter, sortOrder]);

  const hasActiveFilters = Boolean(searchQuery.trim() || subjectFilter || sortOrder !== 'newest');

  const clearFilters = () => {
    setSearchQuery('');
    setSubjectFilter('');
    setSortOrder('newest');
    setFilterOpen(false);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 flex items-center justify-center rounded-lg ${currentPage === i
              ? 'bg-brand-medium-blue text-white border-2 border-brand-gold'
              : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  const mockSessions = [
    {
      id: 1,
      tutor: 'Sarah Mitchell',
      subject: 'Mathematics',
      date: 'Oct 20, 2023',
      time: '02:00 PM - 03:00 PM',
      duration: '1 hour',
      status: 'Completed',
      rating: 5,
      review: 'Great session! Sarah explained everything clearly.',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=SM'
    },
    {
      id: 2,
      tutor: 'James Chen',
      subject: 'Computer Science',
      date: 'Oct 18, 2023',
      time: '04:00 PM - 05:30 PM',
      duration: '1.5 hours',
      status: 'Completed',
      rating: 4,
      review: 'Helpful session, but could be more interactive.',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=JC'
    },
    {
      id: 3,
      tutor: 'Maria Garcia',
      subject: 'Physics',
      date: 'Oct 25, 2023',
      time: '11:00 AM - 12:00 PM',
      duration: '1 hour',
      status: 'Upcoming',
      rating: null,
      review: '',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=MG'
    },
    {
      id: 4,
      tutor: 'David Kim',
      subject: 'Chemistry',
      date: 'Oct 10, 2023',
      time: '03:00 PM - 04:30 PM',
      duration: '1.5 hours',
      status: 'Cancelled',
      rating: null,
      review: 'Session was cancelled by the tutor.',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=DK'
    },
    {
      id: 5,
      tutor: 'Alex Johnson',
      subject: 'Mathematics',
      date: 'Oct 28, 2023',
      time: '10:00 AM - 11:30 AM',
      duration: '1.5 hours',
      status: 'Upcoming',
      rating: null,
      review: '',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=AJ'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {activeTab === 'upcoming' ? 'Upcoming Sessions' : 'My Sessions'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'upcoming'
              ? 'View and manage your scheduled tutoring sessions.'
              : 'View and manage all your tutoring sessions.'}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search sessions..."
              aria-label="Search sessions"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 ${
                filterOpen || hasActiveFilters
                  ? 'border-brand-medium-blue text-brand-medium-blue'
                  : 'border-gray-300'
              }`}
              aria-expanded={filterOpen}
              aria-controls="session-filters-panel"
            >
              <FilterIcon />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/book-session')}
              className="px-4 py-2 bg-brand-medium-blue text-white rounded-lg hover:bg-brand-dark-blue transition-colors shadow-lg"
            >
              New Session
            </button>
          </div>
        </div>

        {filterOpen && (
          <div
            id="session-filters-panel"
            className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="session-subject-filter" className="mb-1 block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <select
                  id="session-subject-filter"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">All subjects</option>
                  {subjectOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="session-sort-order" className="mb-1 block text-sm font-medium text-gray-700">
                  Sort by date
                </label>
                <select
                  id="session-sort-order"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="min-w-[180px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('upcoming')}
              className={`${activeTab === 'upcoming' ? 'border-brand-medium-blue text-brand-medium-blue font-semibold' : 'border-transparent text-gray-500 hover:text-brand-medium-blue hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upcoming
              {activeTab === 'upcoming' && (
                <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {total}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`${activeTab === 'completed' ? 'border-brand-medium-blue text-brand-medium-blue font-semibold' : 'border-transparent text-gray-500 hover:text-brand-medium-blue hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed
              {activeTab === 'completed' && (
                <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {total}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('cancelled')}
              className={`${activeTab === 'cancelled' ? 'border-brand-medium-blue text-brand-medium-blue font-semibold' : 'border-transparent text-gray-500 hover:text-brand-medium-blue hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Cancelled
              {activeTab === 'cancelled' && (
                <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {total}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue"></div>
            <span className="ml-3 text-gray-600">Loading sessions...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium mb-2">Error Loading Sessions</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={fetchSessions}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sessions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} sessions</h3>
            <p className="text-gray-500 mb-4">You don't have any {activeTab} sessions at the moment.</p>
            <button
              onClick={() => navigate('/find-tutors')}
              className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-6 py-2 rounded-lg transition-colors shadow-lg"
            >
              Find a Tutor
            </button>
          </div>
        )}

        {/* No filter matches */}
        {!loading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions match your search</h3>
            <p className="text-gray-500 mb-4">
              Try a different search term or adjust your filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-6 py-2 rounded-lg transition-colors shadow-lg"
            >
              Clear search and filters
            </button>
          </div>
        )}

        {/* Sessions List */}
        {!loading && !error && filteredSessions.length > 0 && (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                id={`session-${session.id}`}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                  highlightSessionId === session.id
                    ? 'border-brand-medium-blue ring-2 ring-brand-medium-blue/30'
                    : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {getTutorProfilePic(session) ? (
                          <img
                            src={getTutorProfilePic(session)}
                            alt={getTutorFirstName(session)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-600">
                            {getTutorFirstName(session).charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Learner</p>
                        <h3 className="font-bold text-lg text-gray-900">
                          {getLearnerFirstName(session)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tutor: {getTutorFirstName(session)}
                          {session.subject?.name ? ` · ${session.subject.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(session.startTime)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-sm">{formatTime(session.startTime, session.endTime)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{calculateDuration(session.startTime, session.endTime)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Upcoming Sessions */}
                  {activeTab === 'upcoming' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                      {session.zoomJoinLink && (
                        <a
                          href={session.zoomJoinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join Zoom Meeting
                        </a>
                      )}
                      {session.status === 'confirmed' && (
                        <button
                          onClick={() => handleOpenCancelDialog(session)}
                          className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {session.status === 'cancelled' && session.cancellationReason && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {session.cancellationReason}
                      </p>
                    </div>
                  )}

                  {/* Leave Review Button for Completed Sessions */}
                  {session.status === 'completed' && !session.reviewAdded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleOpenReviewDialog(session)}
                        className="inline-flex items-center bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Leave a Review
                      </button>
                    </div>
                  )}

                  {/* Review Already Added */}
                  {session.status === 'completed' && session.reviewAdded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-green-600 text-sm">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Review submitted
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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

        {/* Review Dialog */}
        <Dialog 
          open={reviewDialogOpen} 
          onClose={handleCloseReviewDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">Leave a Review</span>
              <button
                onClick={handleCloseReviewDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </DialogTitle>
          <DialogContent>
            {selectedSession && (
              <div className="space-y-6 pt-2">
                {/* Success Message */}
                {reviewSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Submitted!</h3>
                    <p className="text-gray-600">Thank you for your feedback. Your review will be visible after admin approval.</p>
                  </div>
                ) : (
                  <>
                    {/* Tutor Info */}
                    <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedSession.tutor?.profilePic ? (
                          <img
                            src={selectedSession.tutor.profilePic}
                            alt={selectedSession.tutor?.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-gray-600">
                            {selectedSession.tutor?.fullName?.charAt(0) || 'T'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedSession.tutor?.fullName}</h3>
                        <p className="text-sm text-gray-600">{selectedSession.subject?.name}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <Rating
                          name="review-rating"
                          value={reviewRating}
                          onChange={(event, newValue) => {
                            setReviewRating(newValue);
                            setReviewError(null);
                          }}
                          size="large"
                          precision={1}
                        />
                        {reviewRating > 0 && (
                          <span className="text-sm text-gray-600 ml-2">
                            {reviewRating} out of 5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        placeholder="Share your experience with this tutor..."
                        value={reviewComment}
                        onChange={(e) => {
                          setReviewComment(e.target.value);
                          setReviewError(null);
                        }}
                        inputProps={{ maxLength: 500 }}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">Minimum 10 characters</p>
                        <p className="text-xs text-gray-500">{reviewComment.length}/500</p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {reviewError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{reviewError}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            {!reviewSuccess && (
              <>
                <Button
                  onClick={handleCloseReviewDialog}
                  color="inherit"
                  disabled={submittingReview}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  variant="contained"
                  color="primary"
                  disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {renderPagination()}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySessions;

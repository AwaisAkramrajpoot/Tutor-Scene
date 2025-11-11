import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import MessageRequestButton from './Messaging/MessageRequestButton';

const TutorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: '', onConfirm: null });
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspendingTutor, setSuspendingTutor] = useState(false);

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        setLoading(true);
        const data = await apiRequest(`/api/v1/onboarding/tutor/${id}`);
        setTutor(data.tutor || data.data || data);
      } catch (err) {
        console.error('Failed to fetch tutor:', err);
        setError(err.message || 'Failed to load tutor details');
      } finally {
        setLoading(false);
      }
    };
    fetchTutor();
  }, [id]);

  const openConfirmDialog = (action, onConfirm) => {
    setConfirmDialog({ isOpen: true, action, onConfirm });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, action: '', onConfirm: null });
  };

  const handleApproveTutor = async () => {
    try {
      setActionLoading(true);
      setSuccessMessage(null);
      setError(null);
      closeConfirmDialog();

      // Call approve API
      await apiRequest(`/api/v1/onboarding/tutor/${id}/approve`, {
        method: 'POST',
      });

      // Show success message
      setSuccessMessage('Tutor approved successfully!');

      // Navigate back to dashboard immediately
      navigate('/admin-dashboard');
    } catch (err) {
      console.error('Failed to approve tutor:', err);
      setError(err.message || 'Failed to approve tutor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewDateTime) {
      setError('Please select a date and time for the interview');
      return;
    }

    try {
      setInterviewLoading(true);
      setSuccessMessage(null);
      setError(null);

      // Convert to ISO string format
      const startTime = new Date(interviewDateTime).toISOString();

      // Call schedule interview API
      await apiRequest('/api/v1/interviews/schedule-interview', {
        method: 'POST',
        body: JSON.stringify({
          userId: tutor.userId,
          startTime: startTime
        })
      });

      // Show success message
      setSuccessMessage('Interview scheduled successfully!');
      
      // Close modal and reset form
      setShowInterviewModal(false);
      setInterviewDateTime('');

      // Optionally refresh tutor data
      const data = await apiRequest(`/api/v1/onboarding/tutor/${id}`);
      setTutor(data.tutor || data.data || data);
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleSuspendTutor = async () => {
    if (!tutor?.userId) {
      setError('Invalid tutor data');
      return;
    }

    try {
      setSuspendingTutor(true);
      setSuccessMessage(null);
      setError(null);

      await apiRequest(`/api/v1/users/${tutor.userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'suspended',
          suspensionReason: suspensionReason
        }),
      });

      // Show success message
      setSuccessMessage('Tutor suspended successfully!');
      
      // Close modal and reset form
      setShowSuspendModal(false);
      setSuspensionReason('');

      // Refresh tutor data
      const data = await apiRequest(`/api/v1/onboarding/tutor/${id}`);
      setTutor(data.tutor || data.data || data);
    } catch (err) {
      console.error('Failed to suspend tutor:', err);
      setError(err.message || 'Failed to suspend tutor');
    } finally {
      setSuspendingTutor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-medium-blue mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading tutor details...</p>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Tutor</h2>
          <p className="text-gray-600 mb-6">{error || 'Tutor not found'}</p>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-6 py-2 rounded-lg font-medium shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    awaiting_interview: 'bg-brand-light-blue text-brand-dark-blue',
    suspended: 'bg-red-100 text-red-800',
    rejected: 'bg-gray-100 text-gray-800',
    deactivated: 'bg-gray-200 text-gray-600',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center text-brand-medium-blue hover:text-brand-dark-blue mb-6 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Confirmation Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Confirm Action</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to <span className="font-semibold text-gray-900">{confirmDialog.action}</span> this user?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeConfirmDialog}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 bg-brand-medium-blue hover:bg-brand-dark-blue text-white py-2 px-4 rounded-lg font-medium transition-colors shadow-lg"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend Tutor Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Suspend Tutor</h3>
                </div>
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionReason('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                You are about to suspend <span className="font-semibold text-gray-900">{tutor.fullName}</span>. 
                Please provide a reason for this suspension.
              </p>

              {error && showSuspendModal && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="suspensionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="suspensionReason"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  rows={4}
                  placeholder="e.g., Violated terms of service"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be recorded and may be shared with the tutor
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspensionReason('');
                    setError(null);
                  }}
                  disabled={suspendingTutor}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendTutor}
                  disabled={suspendingTutor || !suspensionReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {suspendingTutor ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Suspending...
                    </>
                  ) : (
                    'Suspend Tutor'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Scheduling Modal */}
        {showInterviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Schedule Interview</h3>
                </div>
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    setInterviewDateTime('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Select a date and time for the interview with <span className="font-semibold text-gray-900">{tutor.fullName}</span>
              </p>

              {error && showInterviewModal && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="interviewDateTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="interviewDateTime"
                  value={interviewDateTime}
                  onChange={(e) => setInterviewDateTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    setInterviewDateTime('');
                    setError(null);
                  }}
                  disabled={interviewLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleInterview}
                  disabled={interviewLoading || !interviewDateTime}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {interviewLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scheduling...
                    </>
                  ) : (
                    'Schedule Interview'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {tutor.profilePic ? (
                <img
                  src={tutor.profilePic}
                  alt={tutor.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-gold"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-32 h-32 rounded-full bg-brand-light-blue flex items-center justify-center border-4 border-brand-gold" style={{ display: tutor.profilePic ? 'none' : 'flex' }}>
                <span className="text-5xl text-brand-dark-blue font-bold">
                  {tutor.fullName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>

            {/* Name and Status */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tutor.fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[tutor.status] || 'bg-gray-100 text-gray-600'}`}>
                  {tutor.status?.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-gray-500 text-sm">ID: {tutor.id}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Joined:</strong> {new Date(tutor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {tutor.dateOfBirth && (
                  <p><strong>Date of Birth:</strong> {new Date(tutor.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teaching Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Teaching Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects?.split(',').map((subj, idx) => (
                      <span key={idx} className="px-3 py-1 bg-brand-light-blue text-brand-dark-blue rounded-full text-sm font-medium border border-brand-gold">
                        {subj.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Grade Levels</label>
                  <p className="text-gray-900">{tutor.gradeLevels || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Years of Experience</label>
                  <p className="text-gray-900 font-semibold">{tutor.yearsOfExperience || 0} years</p>
                </div>
                {tutor.interviewTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Interview Time</label>
                    <p className="text-gray-900">{new Date(tutor.interviewTime).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Teaching Philosophy */}
            {tutor.teachingPhilosophy && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Teaching Philosophy</h2>
                <p className="text-gray-700 leading-relaxed">{tutor.teachingPhilosophy}</p>
              </div>
            )}

            {/* Intro Video */}
            {tutor.introVideo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Introduction Video
                </h2>
                <video
                  controls
                  className="w-full rounded-lg"
                  poster={tutor.profilePic}
                >
                  <source src={tutor.introVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </div>

          {/* Right Column - Documents & Actions */}
          <div className="space-y-6">
            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents
              </h2>
              <div className="space-y-3">
                {tutor.cv && (
                  <a
                    href={tutor.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">CV / Resume</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {tutor.govId && (
                  <a
                    href={tutor.govId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Government ID</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {/* Message Request Button for Students */}
                <MessageRequestButton
                  tutorId={tutor.id}
                  tutorName={tutor.fullName}
                />
                
                <button
                  onClick={() => openConfirmDialog('approve', handleApproveTutor)}
                  disabled={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Approving...
                    </>
                  ) : (
                    'Approve Tutor'
                  )}
                </button>
                <button 
                  onClick={() => setShowInterviewModal(true)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Schedule Interview
                </button>
                <button 
                  onClick={() => setShowSuspendModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Suspend Tutor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDetails;
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { apiRequest } from '../../utils/api';

const AdminInterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);

  useEffect(() => {
    fetchAllInterviews();
  }, []);

  const fetchAllInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest('/api/v1/interviews/admin/all', 'GET');
      setInterviews(Array.isArray(data) ? data : data.interviews || []);
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setError(err.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (action, interview) => {
    setConfirmAction(action);
    setSelectedInterview(interview);
    setConfirmDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    setSelectedInterview(null);
  };

  const handleStartMeeting = async (interviewId) => {
    try {
      setActionLoading(interviewId);
      const data = await apiRequest(`/api/v1/interviews/${interviewId}/host-url`, 'GET');
      
      if (data.hostStartUrl) {
        window.open(data.hostStartUrl, '_blank');
      } else {
        setError('Host URL not available');
      }
    } catch (err) {
      console.error('Failed to get host URL:', err);
      setError(err.message || 'Failed to start meeting');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (interviewId, newStatus) => {
    try {
      setActionLoading(interviewId);
      setError(null);
      
      await apiRequest(`/api/v1/interviews/${interviewId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      setSuccessMessage(`Interview marked as ${newStatus}`);
      
      // Refresh interviews
      await fetchAllInterviews();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.message || 'Failed to update interview status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedInterview || !confirmAction) return;

    closeConfirmDialog();

    if (confirmAction === 'complete') {
      await handleUpdateStatus(selectedInterview.id, 'completed');
    } else if (confirmAction === 'cancel') {
      await handleUpdateStatus(selectedInterview.id, 'cancelled');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
          <p className="mt-2 text-gray-600">Manage and conduct prospect interviews</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
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
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Interviews List */}
        {interviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Scheduled</h3>
            <p className="text-gray-500">There are no interviews scheduled at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div key={interview.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {interview.prospectName || `Prospect #${interview.userId}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDateTime(interview.startTime)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Meeting ID: {interview.zoomMeetingId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {interview.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handleStartMeeting(interview.id)}
                          disabled={actionLoading === interview.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {actionLoading === interview.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </>
                          ) : (
                            'Start Meeting'
                          )}
                        </button>
                        
                        <button
                          onClick={() => openConfirmDialog('complete', interview)}
                          disabled={actionLoading === interview.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Mark Complete
                        </button>
                        
                        <button
                          onClick={() => openConfirmDialog('cancel', interview)}
                          disabled={actionLoading === interview.id}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={closeConfirmDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900">
                {confirmAction === 'complete' ? 'Mark Interview Complete' : 'Cancel Interview'}
              </span>
              <button
                onClick={closeConfirmDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={actionLoading === selectedInterview?.id}
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  confirmAction === 'complete' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {confirmAction === 'complete' ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Are you sure you want to proceed with this action?
              </h3>
              <p className="text-gray-600 text-center text-sm">
                {confirmAction === 'complete' 
                  ? `This will mark the interview with ${selectedInterview?.prospectName || 'this prospect'} as completed.`
                  : `This will cancel the interview with ${selectedInterview?.prospectName || 'this prospect'}. This action cannot be undone.`
                }
              </p>
            </div>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button
              onClick={closeConfirmDialog}
              color="inherit"
              disabled={actionLoading === selectedInterview?.id}
            >
              {confirmAction === 'complete' ? 'No, Go Back' : 'No, Keep Interview'}
            </Button>
            <Button
              onClick={handleConfirmAction}
              variant="contained"
              color={confirmAction === 'complete' ? 'success' : 'error'}
              disabled={actionLoading === selectedInterview?.id}
            >
              {actionLoading === selectedInterview?.id 
                ? 'Processing...' 
                : confirmAction === 'complete' 
                  ? 'Yes, Mark Complete' 
                  : 'Yes, Cancel Interview'
              }
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminInterviewsPage;

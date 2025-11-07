import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import EmptyState, { EmptyStateIcons } from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';
import { formatMessageDate } from '../../utils/messagingHelpers';
import { getMessageRequests } from '../../services/messagingService';

const SentMessageRequestsList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch message requests on mount
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMessageRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching sent message requests:', err);
      setError(err.message || 'Failed to load message requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchRequests();
  };

  const handleDismissError = () => {
    setError(null);
  };

  const handleRequestClick = (request) => {
    // If request is accepted, navigate to the conversation
    if (request.status === 'accepted' && request.conversationId) {
      navigate(`/messages?conversation=${request.conversationId}`);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      accepted: {
        text: 'Accepted',
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      rejected: {
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
      >
        {badge.text}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <LoadingSpinner size="lg" text="Loading your message requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Your Message Requests</h2>
        {requests.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {requests.length}
          </span>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />
      )}

      {/* Message Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={EmptyStateIcons.NoRequests}
            title="No Message Requests"
            message="You haven't sent any message requests yet. Browse tutors and send a message request to start a conversation."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              onClick={() => handleRequestClick(request)}
              className={`bg-white border border-gray-200 rounded-lg p-4 transition-shadow ${request.status === 'accepted' ? 'hover:shadow-md cursor-pointer' : ''
                }`}
            >
              <div className="flex items-start gap-3">
                {/* Tutor Avatar */}
                <UserAvatar user={request.tutor} size="md" />

                {/* Request Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {request.tutor?.firstName} {request.tutor?.lastName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatMessageDate(request.createdAt)}
                      </p>
                    </div>
                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Optional Message Preview */}
                  {request.message && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {request.message}
                    </p>
                  )}

                  {/* Action hint for accepted requests */}
                  {request.status === 'accepted' && (
                    <p className="text-xs text-blue-600 font-medium">
                      Click to open conversation →
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentMessageRequestsList;

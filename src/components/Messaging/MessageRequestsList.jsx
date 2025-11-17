import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageRequestCard from './MessageRequestCard';
import EmptyState, { EmptyStateIcons } from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';
import { useMessaging } from '../../contexts/MessagingContext';
import {
  getMessageRequests,
  acceptMessageRequest,
  rejectMessageRequest,
} from '../../services/messagingService';

const MessageRequestsList = () => {
  const navigate = useNavigate();
  const { setMessageRequests, messageRequests, setConversations, conversations, fetchConversations } = useMessaging();
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
      const requests = await getMessageRequests();
      
      // Filter only pending requests
      const pendingRequests = requests.filter((req) => req.status === 'pending');
      setMessageRequests(pendingRequests);
    } catch (err) {
      console.error('Error fetching message requests:', err);
      setError(err.message || 'Failed to load message requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const response = await acceptMessageRequest(requestId);
      
      // Remove request from list
      setMessageRequests((prev) => prev.filter((req) => req.id !== requestId));
      
      // Refetch conversations to get complete data with all participant info
      const updatedConversations = await fetchConversations();
      
      // Find the newly created conversation
      if (response.conversation) {
        const newConversation = updatedConversations.find(
          (conv) => conv.id === response.conversation.id
        );
        
        if (newConversation) {
          // Navigate to the new conversation with complete data
          navigate(`/messages?conversation=${newConversation.id}`);
        }
      }
    } catch (err) {
      console.error('Error accepting message request:', err);
      setError(err.message || 'Failed to accept message request');
      throw err; // Re-throw to let MessageRequestCard handle it
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectMessageRequest(requestId);
      
      // Remove request from list
      setMessageRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error('Error rejecting message request:', err);
      setError(err.message || 'Failed to reject message request');
      throw err; // Re-throw to let MessageRequestCard handle it
    }
  };

  const handleRetry = () => {
    fetchRequests();
  };

  const handleDismissError = () => {
    setError(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <LoadingSpinner size="lg" text="Loading message requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Message Requests</h2>
        {messageRequests.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {messageRequests.length}
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
      {messageRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <EmptyState
            icon={EmptyStateIcons.NoRequests}
            title="No Message Requests"
            message="You don't have any pending message requests at the moment. When students send you message requests, they will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {messageRequests.map((request) => (
            <MessageRequestCard
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageRequestsList;

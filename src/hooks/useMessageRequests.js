// Custom hook for message request management
import { useCallback } from 'react';
import { useMessaging } from '../contexts/MessagingContext';
import {
  sendMessageRequest as sendMessageRequestAPI,
  acceptMessageRequest as acceptMessageRequestAPI,
  rejectMessageRequest as rejectMessageRequestAPI,
  getMessageRequests as getMessageRequestsAPI,
} from '../services/messagingService';

export const useMessageRequests = () => {
  const {
    messageRequests,
    setMessageRequests,
    setLoading,
    setError,
    setConversations,
    setActiveConversation,
  } = useMessaging();

  /**
   * Fetch all message requests for current user
   */
  const fetchMessageRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMessageRequestsAPI();
      const requestsList = response.messageRequests || response.data || response || [];

      setMessageRequests(requestsList);
      return requestsList;
    } catch (err) {
      console.error('Error fetching message requests:', err);
      setError(err.message || 'Failed to load message requests');
      return [];
    } finally {
      setLoading(false);
    }
  }, [setMessageRequests, setLoading, setError]);

  /**
   * Send a message request to a tutor
   * @param {number} tutorId - Tutor user ID
   * @param {string} message - Optional message
   * @returns {Promise<object>} - Created message request
   */
  const sendMessageRequest = useCallback(
    async (tutorId, message = '') => {
      try {
        setLoading(true);
        setError(null);

        const request = await sendMessageRequestAPI(tutorId, message);

        // Add to message requests list
        setMessageRequests((prev) => [request, ...prev]);

        return request;
      } catch (err) {
        console.error('Error sending message request:', err);
        setError(err.message || 'Failed to send message request');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setMessageRequests, setLoading, setError]
  );

  /**
   * Accept a message request (tutors only)
   * @param {number} requestId - Message request ID
   * @returns {Promise<object>} - Updated request and new conversation
   */
  const acceptMessageRequest = useCallback(
    async (requestId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await acceptMessageRequestAPI(requestId);
        const updatedRequest = response.request || response.messageRequest;
        const newConversation = response.conversation;

        // Update message request status
        setMessageRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: 'accepted' } : req
          )
        );

        // Add new conversation to list
        if (newConversation) {
          setConversations((prev) => [newConversation, ...prev]);
          setActiveConversation(newConversation);
        }

        return { request: updatedRequest, conversation: newConversation };
      } catch (err) {
        console.error('Error accepting message request:', err);
        setError(err.message || 'Failed to accept message request');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setMessageRequests, setConversations, setActiveConversation, setLoading, setError]
  );

  /**
   * Reject a message request (tutors only)
   * @param {number} requestId - Message request ID
   * @returns {Promise<object>} - Updated message request
   */
  const rejectMessageRequest = useCallback(
    async (requestId) => {
      try {
        setLoading(true);
        setError(null);

        const updatedRequest = await rejectMessageRequestAPI(requestId);

        // Update message request status
        setMessageRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: 'rejected' } : req
          )
        );

        return updatedRequest;
      } catch (err) {
        console.error('Error rejecting message request:', err);
        setError(err.message || 'Failed to reject message request');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setMessageRequests, setLoading, setError]
  );

  /**
   * Get pending message requests
   * @returns {Array} - Array of pending requests
   */
  const getPendingRequests = useCallback(() => {
    return messageRequests.filter((req) => req.status === 'pending');
  }, [messageRequests]);

  /**
   * Check if a message request exists for a tutor
   * @param {number} tutorId - Tutor user ID
   * @returns {object|null} - Existing request or null
   */
  const getRequestForTutor = useCallback(
    (tutorId) => {
      return messageRequests.find((req) => req.tutorId === tutorId) || null;
    },
    [messageRequests]
  );

  /**
   * Check if user can send request to tutor
   * @param {number} tutorId - Tutor user ID
   * @returns {boolean} - True if can send request
   */
  const canSendRequest = useCallback(
    (tutorId) => {
      const existingRequest = getRequestForTutor(tutorId);
      return !existingRequest || existingRequest.status === 'rejected';
    },
    [getRequestForTutor]
  );

  return {
    messageRequests,
    fetchMessageRequests,
    sendMessageRequest,
    acceptMessageRequest,
    rejectMessageRequest,
    getPendingRequests,
    getRequestForTutor,
    canSendRequest,
  };
};

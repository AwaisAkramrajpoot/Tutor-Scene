// API service functions for messaging endpoints
import { apiRequest, APIError } from '../utils/api';

/**
 * Send a message request to a tutor
 * @param {number} tutorId - Tutor user ID
 * @param {string} message - Optional message
 * @returns {Promise<object>} - Message request object
 */
export const sendMessageRequest = async (tutorId, message = '') => {
  try {
    return await apiRequest('/api/v1/message-requests', {
      method: 'POST',
      body: JSON.stringify({ tutorId, message }),
    });
  } catch (error) {
    if (error instanceof APIError) {
      // Add context to the error
      if (error.code === 'VALIDATION_ERROR') {
        error.message = 'Please check your message and try again.';
      } else if (error.code === 'RATE_LIMIT') {
        error.message = 'You are sending too many requests. Please wait a moment.';
      }
    }
    throw error;
  }
};

/**
 * Get all message requests for current user
 * @returns {Promise<Array>} - Array of message requests
 */
export const getMessageRequests = async () => {
  try {
    return await apiRequest('/api/v1/message-requests');
  } catch (error) {
    if (error instanceof APIError && error.code === 'NETWORK_ERROR') {
      error.message = 'Unable to load message requests. Please check your connection.';
    }
    throw error;
  }
};

/**
 * Accept a message request (tutors only)
 * @param {number} requestId - Message request ID
 * @returns {Promise<object>} - Updated request and new conversation
 */
export const acceptMessageRequest = async (requestId) => {
  try {
    return await apiRequest(`/api/v1/message-requests/${requestId}/accept`, {
      method: 'PATCH',
    });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.code === 'NOT_FOUND') {
        error.message = 'Message request not found or already processed.';
      } else if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to accept this request.';
      }
    }
    throw error;
  }
};

/**
 * Reject a message request (tutors only)
 * @param {number} requestId - Message request ID
 * @returns {Promise<object>} - Updated message request
 */
export const rejectMessageRequest = async (requestId) => {
  try {
    return await apiRequest(`/api/v1/message-requests/${requestId}/reject`, {
      method: 'PATCH',
    });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.code === 'NOT_FOUND') {
        error.message = 'Message request not found or already processed.';
      } else if (error.code === 'FORBIDDEN') {
        error.message = 'You do not have permission to reject this request.';
      }
    }
    throw error;
  }
};

/**
 * Get all conversations for current user
 * @returns {Promise<Array>} - Array of conversations
 */
export const getConversations = async () => {
  try {
    return await apiRequest('/api/v1/conversations');
  } catch (error) {
    if (error instanceof APIError && error.code === 'NETWORK_ERROR') {
      error.message = 'Unable to load conversations. Please check your connection.';
    }
    throw error;
  }
};

/**
 * Get conversation details
 * @param {number} conversationId - Conversation ID
 * @returns {Promise<object>} - Conversation object
 */
export const getConversation = async (conversationId) => {
  try {
    return await apiRequest(`/api/v1/conversations/${conversationId}`);
  } catch (error) {
    if (error instanceof APIError && error.code === 'NOT_FOUND') {
      error.message = 'Conversation not found.';
    }
    throw error;
  }
};

/**
 * Get message history for a conversation
 * @param {number} conversationId - Conversation ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Messages per page (default: 50)
 * @returns {Promise<object>} - Messages array with pagination info
 */
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  try {
    return await apiRequest(`/api/v1/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  } catch (error) {
    if (error instanceof APIError) {
      if (error.code === 'NOT_FOUND') {
        error.message = 'Conversation not found.';
      } else if (error.code === 'NETWORK_ERROR') {
        error.message = 'Unable to load messages. Please check your connection.';
      }
    }
    throw error;
  }
};

/**
 * Send a message via HTTP (fallback)
 * @param {number} conversationId - Conversation ID
 * @param {string} content - Message content
 * @param {string} attachmentUrl - Optional attachment URL
 * @returns {Promise<object>} - Created message
 */
export const sendMessage = async (conversationId, content, attachmentUrl = null) => {
  try {
    return await apiRequest(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachmentUrl }),
    });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.code === 'VALIDATION_ERROR') {
        error.message = 'Message content is invalid. Please try again.';
      } else if (error.code === 'RATE_LIMIT') {
        error.message = 'You are sending messages too quickly. Please slow down.';
      }
    }
    throw error;
  }
};

/**
 * Mark messages as read
 * @param {number} conversationId - Conversation ID
 * @returns {Promise<object>} - Success response
 */
export const markMessagesAsRead = async (conversationId) => {
  try {
    return await apiRequest(`/api/v1/conversations/${conversationId}/mark-read`, {
      method: 'PATCH',
    });
  } catch (error) {
    // Silently fail for mark as read - not critical
    console.warn('Failed to mark messages as read:', error);
    return { success: false };
  }
};

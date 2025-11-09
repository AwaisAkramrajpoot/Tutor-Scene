// Socket.IO client configuration and utilities
import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://tutor-scene-alb-470637409.us-east-1.elb.amazonaws.com';

/**
 * Custom Socket Error class
 */
export class SocketError extends Error {
  constructor(message, code, event = null, retryable = false) {
    super(message);
    this.name = 'SocketError';
    this.code = code;
    this.event = event;
    this.retryable = retryable;
    this.timestamp = new Date();
  }
}

/**
 * Initialize Socket.IO connection for messaging with enhanced error handling
 * @param {Function} onError - Error callback
 * @param {Function} onReconnect - Reconnect callback
 * @returns {Socket} - Socket.IO client instance
 */
export const initializeSocket = (onError = null, onReconnect = null) => {
  const token = getAccessToken();

  if (!token) {
    const error = new SocketError(
      'No access token available for socket connection',
      'AUTH_ERROR',
      null,
      false
    );
    console.error(error.message);
    if (onError) onError(error);
    return null;
  }

  const socket = io(`${API_URL}/messaging`, {
    auth: {
      token: token,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  let reconnectAttempts = 0;

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    reconnectAttempts = 0; // Reset on successful connection
    
    if (onReconnect && socket.recovered) {
      onReconnect();
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    
    // Handle different disconnect reasons
    if (reason === 'io server disconnect') {
      // Server forcefully disconnected - likely auth issue
      const error = new SocketError(
        'Disconnected by server. Please refresh the page.',
        'SERVER_DISCONNECT',
        null,
        false
      );
      if (onError) onError(error);
    } else if (reason === 'transport close' || reason === 'transport error') {
      // Network issue
      const error = new SocketError(
        'Connection lost. Attempting to reconnect...',
        'NETWORK_ERROR',
        null,
        true
      );
      if (onError) onError(error);
    }
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error(`Socket connection error (attempt ${reconnectAttempts}/5):`, error);
    
    let socketError;
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      socketError = new SocketError(
        'Authentication failed. Please log in again.',
        'AUTH_ERROR',
        null,
        false
      );
    } else if (reconnectAttempts >= 5) {
      socketError = new SocketError(
        'Unable to connect after multiple attempts. Please check your connection and refresh.',
        'CONNECTION_FAILED',
        null,
        false
      );
    } else {
      socketError = new SocketError(
        `Connection error. Retrying (${reconnectAttempts}/5)...`,
        'CONNECTION_ERROR',
        null,
        true
      );
    }
    
    if (onError) onError(socketError);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt ${attemptNumber}`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`);
    reconnectAttempts = 0;
    if (onReconnect) onReconnect();
  });

  socket.on('reconnect_failed', () => {
    console.error('Reconnection failed after all attempts');
    const error = new SocketError(
      'Failed to reconnect. Please refresh the page.',
      'RECONNECT_FAILED',
      null,
      false
    );
    if (onError) onError(error);
  });

  // Handle socket event errors
  socket.on('error', ({ event, message, code }) => {
    console.error(`Socket error [${code}] on ${event}:`, message);
    
    const socketError = new SocketError(
      message || 'An error occurred',
      code || 'SOCKET_ERROR',
      event,
      false
    );
    
    if (onError) onError(socketError);
  });

  return socket;
};

/**
 * Disconnect socket connection
 * @param {Socket} socket - Socket.IO client instance
 */
export const disconnectSocket = (socket) => {
  if (socket) {
    socket.disconnect();
    console.log('Socket disconnected manually');
  }
};

/**
 * Join a conversation room
 * @param {Socket} socket - Socket.IO client instance
 * @param {number} conversationId - Conversation ID
 */
export const joinConversation = (socket, conversationId) => {
  if (socket && socket.connected) {
    socket.emit('joinConversation', { conversationId });
  }
};

/**
 * Leave a conversation room
 * @param {Socket} socket - Socket.IO client instance
 * @param {number} conversationId - Conversation ID
 */
export const leaveConversation = (socket, conversationId) => {
  if (socket && socket.connected) {
    socket.emit('leaveConversation', { conversationId });
  }
};

/**
 * Send a message via socket
 * @param {Socket} socket - Socket.IO client instance
 * @param {number} conversationId - Conversation ID
 * @param {string} content - Message content
 * @param {string} attachmentUrl - Optional attachment URL
 */
export const sendMessageViaSocket = (socket, conversationId, content, attachmentUrl = null) => {
  if (socket && socket.connected) {
    socket.emit('sendMessage', {
      conversationId,
      content,
      attachmentUrl,
    });
  }
};

/**
 * Emit typing indicator
 * @param {Socket} socket - Socket.IO client instance
 * @param {number} conversationId - Conversation ID
 * @param {boolean} isTyping - Typing status
 */
export const emitTyping = (socket, conversationId, isTyping) => {
  if (socket && socket.connected) {
    socket.emit('typing', {
      conversationId,
      isTyping,
    });
  }
};

/**
 * Mark messages as read via socket
 * @param {Socket} socket - Socket.IO client instance
 * @param {number} conversationId - Conversation ID
 */
export const markAsReadViaSocket = (socket, conversationId) => {
  if (socket && socket.connected) {
    socket.emit('markAsRead', { conversationId });
  }
};

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import { getCurrentUser } from '../utils/api';
import {
  getConversations as fetchConversationsAPI,
  getMessages as fetchMessagesAPI,
  sendMessageRequest as sendMessageRequestAPI,
  acceptMessageRequest as acceptMessageRequestAPI,
  rejectMessageRequest as rejectMessageRequestAPI,
  getMessageRequests as getMessageRequestsAPI,
  markMessagesAsRead as markMessagesAsReadAPI,
} from '../services/messagingService';

const MessagingContext = createContext();

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
};

export const MessagingProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [messageRequests, setMessageRequests] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messagePagination, setMessagePagination] = useState({});

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;
  const socketRef = useRef(null);
  const typingTimeouts = useRef({});
  const activeConversationRef = useRef(null);

  // Socket error handler - stable, no dependencies
  const handleSocketError = useCallback((error) => {
    console.error('Socket error:', error);
    setError(error);
    
    // Handle authentication errors by redirecting to login
    if (error.code === 'AUTH_ERROR') {
      setTimeout(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/signin';
      }, 2000);
    }
  }, []);

  // Fetch all conversations - using ref to avoid dependency issues
  const fetchConversationsRef = useRef();
  fetchConversationsRef.current = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchConversationsAPI();
      
      // Sort conversations by most recent activity
      const sortedConversations = data.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
        return dateB - dateA;
      });
      
      setConversations(sortedConversations);
      return sortedConversations;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = useCallback(async () => {
    return fetchConversationsRef.current();
  }, []);

  // Socket reconnect handler - stable, no dependencies
  const handleSocketReconnect = useCallback(() => {
    console.log('Socket reconnected, refreshing data...');
    setError(null);
    setIsConnected(true);
    
    // Rejoin active conversation if exists
    if (activeConversationRef.current && socketRef.current) {
      socketRef.current.emit('joinConversation', {
        conversationId: activeConversationRef.current.id,
      });
    }
    
    // Refresh conversations
    if (fetchConversationsRef.current) {
      fetchConversationsRef.current().catch(err => {
        console.error('Failed to refresh conversations after reconnect:', err);
      });
    }
  }, []);

  // Initialize socket connection - now stable with no changing dependencies
  const connectSocket = useCallback(() => {
    if (socketRef.current) {
      return socketRef.current;
    }

    const newSocket = initializeSocket(handleSocketError, handleSocketReconnect);
    if (!newSocket) {
      setError({ message: 'Failed to initialize socket connection', code: 'INIT_ERROR' });
      return null;
    }

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    // User online/offline events
    newSocket.on('userOnline', ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    newSocket.on('userOffline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // New message event
    newSocket.on('newMessage', ({ message }) => {
      console.log('New message received:', message);

      // Add message to messages state
      setMessages((prev) => {
        const conversationMessages = prev[message.conversationId] || [];
        return {
          ...prev,
          [message.conversationId]: [...conversationMessages, message],
        };
      });

      // Update conversation last message and unread count
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === message.conversationId) {
            const isActive = activeConversationRef.current?.id === message.conversationId;
            return {
              ...conv,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount: isActive ? conv.unreadCount : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        })
      );
    });

    // Message delivered event
    newSocket.on('messageDelivered', ({ messageId, conversationId }) => {
      setMessages((prev) => {
        const conversationMessages = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: conversationMessages.map((msg) =>
            msg.id === messageId ? { ...msg, status: 'delivered' } : msg
          ),
        };
      });
    });

    // Typing indicator event
    newSocket.on('userTyping', ({ conversationId, userId, isTyping }) => {
      if (userId === currentUser?.id) return;

      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (isTyping) {
          updated[conversationId] = userId;

          // Clear existing timeout
          if (typingTimeouts.current[conversationId]) {
            clearTimeout(typingTimeouts.current[conversationId]);
          }

          // Auto-hide after 5 seconds
          typingTimeouts.current[conversationId] = setTimeout(() => {
            setTypingUsers((p) => {
              const u = { ...p };
              delete u[conversationId];
              return u;
            });
          }, 5000);
        } else {
          delete updated[conversationId];
          if (typingTimeouts.current[conversationId]) {
            clearTimeout(typingTimeouts.current[conversationId]);
            delete typingTimeouts.current[conversationId];
          }
        }
        return updated;
      });
    });

    // Message read event
    newSocket.on('messageRead', ({ conversationId, count }) => {
      setMessages((prev) => {
        const conversationMessages = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: conversationMessages.map((msg) =>
            !msg.isRead ? { ...msg, isRead: true, status: 'read' } : msg
          ),
        };
      });

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    });

    // Joined conversation event
    newSocket.on('joinedConversation', ({ conversationId, message: msg }) => {
      console.log(`Joined conversation ${conversationId}:`, msg);
    });

    // Left conversation event
    newSocket.on('leftConversation', ({ conversationId, message: msg }) => {
      console.log(`Left conversation ${conversationId}:`, msg);
    });

    // Error event
    newSocket.on('error', ({ event, message: msg, code }) => {
      console.error(`Socket error [${code}] on ${event}:`, msg);
      setError(msg);
    });

    return newSocket;
  }, [handleSocketError, handleSocketReconnect]);

  // Disconnect socket
  const disconnectSocketConnection = useCallback(() => {
    if (socketRef.current) {
      disconnectSocket(socketRef.current);
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    if (currentUserId) {
      connectSocket();
    }

    return () => {
      disconnectSocketConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Set active conversation and manage chat state
  const setActiveConversationWithManagement = useCallback((conversation) => {
    // Leave previous conversation if exists
    if (activeConversationRef.current && socketRef.current) {
      socketRef.current.emit('leaveConversation', {
        conversationId: activeConversationRef.current.id,
      });
    }

    // Set new active conversation
    setActiveConversation(conversation);
    activeConversationRef.current = conversation;

    // Join new conversation if exists
    if (conversation && socketRef.current) {
      socketRef.current.emit('joinConversation', {
        conversationId: conversation.id,
      });

      // Mark messages as read when conversation becomes active
      if (conversation.unreadCount > 0) {
        markMessagesAsReadAPI(conversation.id)
          .then(() => {
            // Update local state
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
              )
            );
          })
          .catch((err) => {
            console.error('Error marking messages as read:', err);
          });
      }
    }
  }, []);

  const value = {
    socket,
    isConnected,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation: setActiveConversationWithManagement,
    messages,
    setMessages,
    messageRequests,
    setMessageRequests,
    onlineUsers,
    typingUsers,
    loading,
    setLoading,
    error,
    setError,
    messagePagination,
    setMessagePagination,
    currentUser,
    connectSocket,
    disconnectSocketConnection,
    fetchConversations,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

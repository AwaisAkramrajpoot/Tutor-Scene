import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import {
  getConversations as fetchConversationsAPI,
  getMessages as fetchMessagesAPI,
  sendMessageRequest as sendMessageRequestAPI,
  acceptMessageRequest as acceptMessageRequestAPI,
  rejectMessageRequest as rejectMessageRequestAPI,
  getMessageRequests as getMessageRequestsAPI,
  markMessagesAsRead as markMessagesAsReadAPI,
} from '../services/messagingService';
import { dedupeMessages, sameUserId } from '../utils/messagingHelpers';

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

  const userJson = localStorage.getItem('user');
  const currentUser = useMemo(
    () => (userJson ? JSON.parse(userJson) : null),
    [userJson],
  );
  const currentUserId = currentUser?.id;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
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
      if (activeConversationRef.current) {
        newSocket.emit('joinConversation', {
          conversationId: activeConversationRef.current.id,
        });
      }
    });

    newSocket.on('connected', ({ onlineUserIds = [] }) => {
      setOnlineUsers(
        new Set(
          Array.isArray(onlineUserIds)
            ? onlineUserIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
            : [],
        ),
      );
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('userOnline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.add(Number(userId));
        return updated;
      });
    });

    newSocket.on('userOffline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(Number(userId));
        return updated;
      });
    });

    // New message event
    newSocket.on('newMessage', ({ message }) => {
      const conversationId = Number(message.conversationId);
      const normalizedMessage = {
        ...message,
        conversationId,
        senderId: Number(message.senderId),
        status: 'delivered',
      };

      setMessages((prev) => {
        const conversationMessages = prev[conversationId] || prev[message.conversationId] || [];

        const existsById = conversationMessages.some(
          (msg) =>
            !String(msg.id).startsWith('temp-') &&
            msg.id === normalizedMessage.id,
        );
        if (existsById) {
          return prev;
        }

        const isSentByMe = sameUserId(
          normalizedMessage.senderId,
          currentUserIdRef.current,
        );

        if (isSentByMe) {
          const optimisticIndex = conversationMessages.findIndex(
            (msg) =>
              String(msg.id).startsWith('temp-') &&
              sameUserId(msg.senderId, normalizedMessage.senderId) &&
              (msg.content?.trim() || '') === (normalizedMessage.content?.trim() || ''),
          );

          if (optimisticIndex !== -1) {
            const updatedMessages = [...conversationMessages];
            updatedMessages[optimisticIndex] = normalizedMessage;
            return {
              ...prev,
              [conversationId]: dedupeMessages(updatedMessages),
            };
          }
        }

        return {
          ...prev,
          [conversationId]: dedupeMessages([
            ...conversationMessages,
            normalizedMessage,
          ]),
        };
      });

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            const isActive = activeConversationRef.current?.id === conversationId;
            const isSentByCurrentUser = sameUserId(
              normalizedMessage.senderId,
              currentUserIdRef.current,
            );
            return {
              ...conv,
              lastMessage: normalizedMessage,
              lastMessageAt: normalizedMessage.createdAt,
              unreadCount:
                isActive || isSentByCurrentUser
                  ? conv.unreadCount
                  : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        }),
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
    const previousId = activeConversationRef.current?.id ?? null;
    const nextId = conversation?.id ?? null;

    if (previousId === nextId) {
      if (conversation && activeConversationRef.current !== conversation) {
        setActiveConversation(conversation);
        activeConversationRef.current = conversation;
      }
      return;
    }

    if (previousId != null && socketRef.current) {
      socketRef.current.emit('leaveConversation', {
        conversationId: previousId,
      });
    }

    setActiveConversation(conversation);
    activeConversationRef.current = conversation;

    if (conversation && socketRef.current) {
      socketRef.current.emit('joinConversation', {
        conversationId: conversation.id,
      });

      if (conversation.unreadCount > 0) {
        markMessagesAsReadAPI(conversation.id)
          .then(() => {
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

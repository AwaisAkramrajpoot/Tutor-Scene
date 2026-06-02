// Custom hook for message management
import { useCallback } from 'react';
import { useMessaging } from '../contexts/MessagingContext';
import {
  getMessages as fetchMessagesAPI,
  sendMessage as sendMessageAPI,
  markMessagesAsRead as markMessagesAsReadAPI,
} from '../services/messagingService';
import {
  sendMessageViaSocket,
  markAsReadViaSocket,
  joinConversation,
  leaveConversation,
} from '../utils/socket';
import { dedupeMessages } from '../utils/messagingHelpers';

export const useMessages = () => {
  const {
    socket,
    isConnected,
    messages,
    setMessages,
    activeConversation,
    messagePagination,
    setMessagePagination,
    setLoading,
    setError,
    setConversations,
    currentUser,
  } = useMessaging();

  /**
   * Fetch messages for a conversation
   * @param {number} conversationId - Conversation ID
   * @param {number} page - Page number
   * @returns {Promise<object>} - Messages and pagination info
   */
  const fetchMessages = useCallback(
    async (conversationId, page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchMessagesAPI(conversationId, page);
        const messagesList = response.messages || response.data || [];
        const total = response.total || messagesList.length;
        const currentPage = response.page || page;
        const limit = response.limit || 50;

        // Update messages state
        setMessages((prev) => {
          const existing = prev[conversationId] || [];

          if (page === 1) {
            const pendingOptimistic = existing.filter((msg) =>
              String(msg.id).startsWith('temp-'),
            );
            return {
              ...prev,
              [conversationId]: dedupeMessages([...messagesList, ...pendingOptimistic]),
            };
          }

          const combined = [...messagesList, ...existing];
          return {
            ...prev,
            [conversationId]: dedupeMessages(combined),
          };
        });

        // Update pagination info
        setMessagePagination((prev) => ({
          ...prev,
          [conversationId]: {
            page: currentPage,
            total,
            limit,
            hasMore: currentPage * limit < total,
          },
        }));

        return { messages: messagesList, total, page: currentPage, limit };
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(err.message || 'Failed to load messages');
        return { messages: [], total: 0, page: 1, limit: 50 };
      } finally {
        setLoading(false);
      }
    },
    [setMessages, setMessagePagination, setLoading, setError]
  );

  /**
   * Send a message
   * @param {number} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {string} attachmentUrl - Optional attachment URL
   * @returns {Promise<object>} - Sent message
   */
  const sendMessage = useCallback(
    async (conversationId, content, attachmentUrl = null) => {
      if (!content || !content.trim()) {
        return null;
      }

      try {
        // Create optimistic message
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          conversationId: Number(conversationId),
          senderId: Number(currentUser?.id),
          content: content.trim(),
          attachmentUrl,
          isRead: false,
          createdAt: new Date().toISOString(),
          status: 'sending',
        };

        setMessages((prev) => ({
          ...prev,
          [conversationId]: dedupeMessages([
            ...(prev[conversationId] || []),
            optimisticMessage,
          ]),
        }));

        // Store in localStorage for recovery (user-specific to avoid conflicts between tabs)
        const failedMessagesKey = `failed_messages_${currentUser?.id}_${conversationId}`;
        const storedFailedMessages = JSON.parse(localStorage.getItem(failedMessagesKey) || '[]');
        storedFailedMessages.push(optimisticMessage);
        localStorage.setItem(failedMessagesKey, JSON.stringify(storedFailedMessages));

        // Send via socket if connected
        if (socket && isConnected) {
          sendMessageViaSocket(socket, conversationId, content.trim(), attachmentUrl);
          
          // Remove from failed messages on successful send
          const failedMessagesKey = `failed_messages_${currentUser?.id}_${conversationId}`;
          const storedFailedMessages = JSON.parse(localStorage.getItem(failedMessagesKey) || '[]');
          const updatedFailedMessages = storedFailedMessages.filter(msg => msg.id !== optimisticMessage.id);
          localStorage.setItem(failedMessagesKey, JSON.stringify(updatedFailedMessages));
        } else {
          // Fallback to HTTP
          const sentMessage = await sendMessageAPI(conversationId, content.trim(), attachmentUrl);

          // Replace optimistic message with real message
          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map((msg) =>
              msg.id === optimisticMessage.id ? { ...sentMessage, status: 'delivered' } : msg
            ),
          }));

          // Remove from failed messages
          const failedMessagesKey = `failed_messages_${currentUser?.id}_${conversationId}`;
          const storedFailedMessages = JSON.parse(localStorage.getItem(failedMessagesKey) || '[]');
          const updatedFailedMessages = storedFailedMessages.filter(msg => msg.id !== optimisticMessage.id);
          localStorage.setItem(failedMessagesKey, JSON.stringify(updatedFailedMessages));

          return sentMessage;
        }

        return optimisticMessage;
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err);

        // Mark optimistic message as failed
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((msg) =>
            msg.status === 'sending' ? { ...msg, status: 'failed' } : msg
          ),
        }));

        throw err;
      }
    },
    [socket, isConnected, currentUser, setMessages, setError]
  );

  /**
   * Retry sending a failed message
   * @param {object} failedMessage - Failed message object
   * @returns {Promise<object>} - Sent message
   */
  const retryMessage = useCallback(
    async (failedMessage) => {
      const { conversationId, content, attachmentUrl } = failedMessage;

      try {
        // Update message status to sending
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((msg) =>
            msg.id === failedMessage.id ? { ...msg, status: 'sending' } : msg
          ),
        }));

        // Try to send via socket if connected
        if (socket && isConnected) {
          sendMessageViaSocket(socket, conversationId, content, attachmentUrl);
          
          // Remove from localStorage on successful retry
          const failedMessagesKey = `failed_messages_${currentUser?.id}_${conversationId}`;
          const storedFailedMessages = JSON.parse(localStorage.getItem(failedMessagesKey) || '[]');
          const updatedFailedMessages = storedFailedMessages.filter(msg => msg.id !== failedMessage.id);
          localStorage.setItem(failedMessagesKey, JSON.stringify(updatedFailedMessages));
          
          return failedMessage;
        } else {
          // Fallback to HTTP
          const sentMessage = await sendMessageAPI(conversationId, content, attachmentUrl);

          // Replace failed message with real message
          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map((msg) =>
              msg.id === failedMessage.id ? { ...sentMessage, status: 'delivered' } : msg
            ),
          }));

          // Remove from localStorage
          const failedMessagesKey = `failed_messages_${currentUser?.id}_${conversationId}`;
          const storedFailedMessages = JSON.parse(localStorage.getItem(failedMessagesKey) || '[]');
          const updatedFailedMessages = storedFailedMessages.filter(msg => msg.id !== failedMessage.id);
          localStorage.setItem(failedMessagesKey, JSON.stringify(updatedFailedMessages));

          return sentMessage;
        }
      } catch (err) {
        console.error('Error retrying message:', err);
        setError(err);

        // Mark message as failed again
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((msg) =>
            msg.id === failedMessage.id ? { ...msg, status: 'failed' } : msg
          ),
        }));

        throw err;
      }
    },
    [socket, isConnected, setMessages, setError]
  );

  /**
   * Load failed messages from localStorage
   * @param {number} conversationId - Conversation ID
   */
  const loadFailedMessages = useCallback(
    (conversationId) => {
      const failedMessagesKey = `failed_messages_${currentUser?.id}_${conversationId}`;
      const storedFailedMessages = JSON.parse(localStorage.getItem(failedMessagesKey) || '[]');

      if (storedFailedMessages.length === 0) return;

      setMessages((prev) => {
        const existing = prev[conversationId] || [];
        const merged = dedupeMessages([
          ...existing,
          ...storedFailedMessages.map((msg) => ({ ...msg, status: 'failed' })),
        ]);
        return {
          ...prev,
          [conversationId]: merged,
        };
      });
    },
    [setMessages, currentUser?.id]
  );

  /**
   * Mark messages as read
   * @param {number} conversationId - Conversation ID
   */
  const markAsRead = useCallback(
    async (conversationId) => {
      try {
        // Mark via socket if connected
        if (socket && isConnected) {
          markAsReadViaSocket(socket, conversationId);
        } else {
          // Fallback to HTTP
          await markMessagesAsReadAPI(conversationId);
        }

        // Update local state
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((msg) =>
            !msg.isRead ? { ...msg, isRead: true, status: 'read' } : msg
          ),
        }));

        // Update conversation unread count
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    },
    [socket, isConnected, setMessages, setConversations]
  );

  /**
   * Join a conversation room
   * @param {number} conversationId - Conversation ID
   */
  const joinConversationRoom = useCallback(
    (conversationId) => {
      if (socket && isConnected) {
        joinConversation(socket, conversationId);
      }
    },
    [socket, isConnected]
  );

  /**
   * Leave a conversation room
   * @param {number} conversationId - Conversation ID
   */
  const leaveConversationRoom = useCallback(
    (conversationId) => {
      if (socket && isConnected) {
        leaveConversation(socket, conversationId);
      }
    },
    [socket, isConnected]
  );

  /**
   * Get messages for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Array} - Array of messages
   */
  const getConversationMessages = useCallback(
    (conversationId) => {
      return messages[conversationId] || [];
    },
    [messages]
  );

  /**
   * Get pagination info for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {object} - Pagination info
   */
  const getPaginationInfo = useCallback(
    (conversationId) => {
      return messagePagination[conversationId] || { page: 0, total: 0, limit: 50, hasMore: true };
    },
    [messagePagination]
  );

  /**
   * Load more messages (previous page)
   * @param {number} conversationId - Conversation ID
   */
  const loadMoreMessages = useCallback(
    async (conversationId) => {
      const pagination = getPaginationInfo(conversationId);
      if (!pagination.hasMore) {
        return;
      }

      const nextPage = pagination.page + 1;
      await fetchMessages(conversationId, nextPage);
    },
    [getPaginationInfo, fetchMessages]
  );

  const fetchAllMessages = useCallback(
    async (conversationId) => {
      let result = await fetchMessages(conversationId, 1);
      let page = result.page || 1;
      const limit = result.limit || 50;
      const total = result.total || (result.messages || []).length;
      let hasMore = page * limit < total;

      while (hasMore) {
        page += 1;
        result = await fetchMessages(conversationId, page);
        hasMore = page * limit < (result.total || total);
      }

      return result.messages || [];
    },
    [fetchMessages]
  );

  return {
    messages,
    fetchMessages,
    sendMessage,
    retryMessage,
    markAsRead,
    joinConversationRoom,
    leaveConversationRoom,
    getConversationMessages,
    getPaginationInfo,
    loadMoreMessages,
    loadFailedMessages,
    fetchAllMessages,
  };
};

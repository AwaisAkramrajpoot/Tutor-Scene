// Custom hook for conversation management
import { useCallback } from 'react';
import { useMessaging } from '../contexts/MessagingContext';
import { getConversations as fetchConversationsAPI } from '../services/messagingService';
import { sortConversationsByRecent } from '../utils/messagingHelpers';

export const useConversations = () => {
  const {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    setLoading,
    setError,
  } = useMessaging();

  /**
   * Fetch all conversations for current user
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchConversationsAPI();
      const conversationsList = response.conversations || response.data || response || [];

      // Sort by most recent activity
      const sortedConversations = sortConversationsByRecent(conversationsList);

      setConversations(sortedConversations);
      return sortedConversations;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [setConversations, setLoading, setError]);

  /**
   * Select a conversation as active
   * @param {object} conversation - Conversation to set as active
   */
  const selectConversation = useCallback(
    (conversation) => {
      setActiveConversation(conversation);
    },
    [setActiveConversation]
  );

  /**
   * Clear active conversation
   */
  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null);
  }, [setActiveConversation]);

  /**
   * Update a conversation in the list
   * @param {number} conversationId - Conversation ID
   * @param {object} updates - Updates to apply
   */
  const updateConversation = useCallback(
    (conversationId, updates) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, ...updates } : conv
        )
      );

      // Update active conversation if it's the one being updated
      if (activeConversation?.id === conversationId) {
        setActiveConversation((prev) => ({ ...prev, ...updates }));
      }
    },
    [setConversations, activeConversation, setActiveConversation]
  );

  /**
   * Add a new conversation to the list
   * @param {object} conversation - New conversation
   */
  const addConversation = useCallback(
    (conversation) => {
      setConversations((prev) => {
        // Check if conversation already exists
        const exists = prev.some((conv) => conv.id === conversation.id);
        if (exists) {
          return prev;
        }

        // Add and sort
        const updated = [conversation, ...prev];
        return sortConversationsByRecent(updated);
      });
    },
    [setConversations]
  );

  /**
   * Remove a conversation from the list
   * @param {number} conversationId - Conversation ID to remove
   */
  const removeConversation = useCallback(
    (conversationId) => {
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

      // Clear active conversation if it's the one being removed
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    },
    [setConversations, activeConversation, setActiveConversation]
  );

  /**
   * Get conversation by ID
   * @param {number} conversationId - Conversation ID
   * @returns {object|null} - Conversation object or null
   */
  const getConversationById = useCallback(
    (conversationId) => {
      return conversations.find((conv) => conv.id === conversationId) || null;
    },
    [conversations]
  );

  return {
    conversations,
    activeConversation,
    fetchConversations,
    selectConversation,
    clearActiveConversation,
    updateConversation,
    addConversation,
    removeConversation,
    getConversationById,
  };
};

import React, { useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useMessaging } from '../../contexts/MessagingContext';
import { useMessages } from '../../hooks/useMessages';
import { emitTyping } from '../../utils/socket';

const ChatWindow = ({ onBack = null }) => {
  const {
    socket,
    isConnected,
    activeConversation,
    currentUser,
    onlineUsers,
    typingUsers,
  } = useMessaging();

  const {
    getConversationMessages,
    getPaginationInfo,
    fetchMessages,
    sendMessage,
    retryMessage,
    joinConversationRoom,
    leaveConversationRoom,
    loadMoreMessages,
    loadFailedMessages,
  } = useMessages();

  // Get conversation data
  const conversationId = activeConversation?.id;
  const messages = getConversationMessages(conversationId);
  const pagination = getPaginationInfo(conversationId);

  // Determine the other user in the conversation
  const otherUser = activeConversation
    ? currentUser?.role === 'student'
      ? activeConversation.tutor
      : activeConversation.student
    : null;

  // Check if other user is online
  const isOtherUserOnline = otherUser ? onlineUsers.has(otherUser.id) : false;

  // Get typing user
  const typingUserId = conversationId ? typingUsers[conversationId] : null;
  const typingUser = typingUserId === otherUser?.id ? otherUser : null;

  // Join conversation on mount and leave on unmount
  useEffect(() => {
    if (conversationId) {
      // Join conversation room
      joinConversationRoom(conversationId);

      // Fetch initial messages
      fetchMessages(conversationId, 1);

      // Load any failed messages from localStorage
      loadFailedMessages(conversationId);

      // Cleanup: leave conversation on unmount
      return () => {
        leaveConversationRoom(conversationId);
      };
    }
  }, [conversationId, joinConversationRoom, leaveConversationRoom, fetchMessages, loadFailedMessages]);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content) => {
      if (!conversationId || !content.trim()) return;

      try {
        await sendMessage(conversationId, content);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [conversationId, sendMessage]
  );

  // Handle typing indicator
  const handleTyping = useCallback(
    (isTyping) => {
      if (!conversationId || !socket || !isConnected) return;

      emitTyping(socket, conversationId, isTyping);
    },
    [conversationId, socket, isConnected]
  );

  // Handle loading more messages
  const handleLoadMore = useCallback(() => {
    if (conversationId && pagination.hasMore) {
      loadMoreMessages(conversationId);
    }
  }, [conversationId, pagination.hasMore, loadMoreMessages]);

  // Handle retrying failed message
  const handleRetryMessage = useCallback(
    async (failedMessage) => {
      try {
        await retryMessage(failedMessage);
      } catch (error) {
        console.error('Failed to retry message:', error);
      }
    },
    [retryMessage]
  );

  // If no active conversation, show empty state
  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <ChatHeader
        user={otherUser}
        isOnline={isOtherUserOnline}
        onBack={onBack}
      />

      {/* Message List */}
      <MessageList
        messages={messages}
        currentUserId={currentUser?.id}
        onLoadMore={handleLoadMore}
        hasMore={pagination.hasMore}
        loading={false}
        typingUser={typingUser}
        onRetryMessage={handleRetryMessage}
      />

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
        placeholder={
          isConnected
            ? 'Type a message...'
            : 'Connecting...'
        }
      />
    </div>
  );
};

export default ChatWindow;

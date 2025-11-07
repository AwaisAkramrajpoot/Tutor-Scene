import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import LoadingSpinner from './LoadingSpinner';
import { groupMessagesByDate, throttle } from '../../utils/messagingHelpers';

const MessageList = ({
  messages = [],
  currentUserId,
  onLoadMore,
  hasMore = false,
  loading = false,
  typingUser = null,
  onRetryMessage = null,
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousScrollHeight = useRef(0);
  const throttledHandleScroll = useRef(null);
  const messageCache = useRef(new Map());

  // Group messages by date - memoized to prevent recalculation
  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  // Cache rendered message bubbles to improve performance
  const getCachedMessage = useCallback((message, isOwn, showAvatar) => {
    const cacheKey = `${message.id}-${message.status}-${isOwn}-${showAvatar}`;
    
    if (!messageCache.current.has(cacheKey)) {
      messageCache.current.set(
        cacheKey,
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={isOwn}
          showAvatar={showAvatar}
          showTimestamp={true}
          onRetry={isOwn ? onRetryMessage : null}
        />
      );
    }
    
    return messageCache.current.get(cacheKey);
  }, [onRetryMessage]);

  // Clear cache when messages change significantly
  useEffect(() => {
    // Keep cache size manageable (max 200 entries)
    if (messageCache.current.size > 200) {
      const entries = Array.from(messageCache.current.entries());
      const toKeep = entries.slice(-100);
      messageCache.current = new Map(toKeep);
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Maintain scroll position when loading history
  useEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop += scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messages]);

  // Handle scroll for infinite scroll and auto-scroll detection
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

    // Check if user is at the bottom (within 100px threshold)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);

    // Load more messages when scrolled to top
    if (scrollTop === 0 && hasMore && !loading && onLoadMore) {
      previousScrollHeight.current = scrollHeight;
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  // Create throttled scroll handler
  useEffect(() => {
    throttledHandleScroll.current = throttle(handleScroll, 100);
  }, [handleScroll]);

  // Wrapper function for scroll event
  const onScroll = useCallback(() => {
    if (throttledHandleScroll.current) {
      throttledHandleScroll.current();
    }
  }, []);

  // Render message groups - memoized
  const renderedGroups = useMemo(() => {
    return groupedMessages.map((group) => (
      <div key={group.date}>
        {/* Date separator */}
        <div className="flex justify-center my-4">
          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
            {group.date}
          </span>
        </div>

        {/* Messages for this date */}
        {group.messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const prevMessage = group.messages[index - 1];
          const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

          return getCachedMessage(message, isOwn, showAvatar);
        })}
      </div>
    ));
  }, [groupedMessages, currentUserId, getCachedMessage]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={onScroll}
    >
      {/* Loading indicator at top */}
      {loading && hasMore && (
        <div className="flex justify-center py-2">
          <LoadingSpinner size="sm" text="Loading messages..." />
        </div>
      )}

      {/* Messages grouped by date */}
      {renderedGroups}

      {/* Typing indicator */}
      {typingUser && (
        <TypingIndicator
          userName={`${typingUser.firstName} ${typingUser.lastName}`}
          autoHideTimeout={5000}
        />
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import LoadingSpinner from './LoadingSpinner';
import {
  groupMessagesByDate,
  throttle,
  dedupeMessages,
  sameUserId,
} from '../../utils/messagingHelpers';

const MessageList = ({
  messages = [],
  currentUserId,
  onLoadMore,
  hasMore = false,
  loading = false,
  typingUser = null,
  onRetryMessage = null,
  highlightMessageId = null,
  searchQuery = "",
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousScrollHeight = useRef(0);
  const throttledHandleScroll = useRef(null);
  const previousMessageCount = useRef(0);
  const messageRefs = useRef({});
  const isInitialLoad = useRef(true);

  const groupedMessages = useMemo(() => {
    const uniqueMessages = dedupeMessages(messages);
    return groupMessagesByDate(uniqueMessages);
  }, [messages]);

  useEffect(() => {
    if (!highlightMessageId) return undefined;

    const scrollToHighlight = () => {
      const node = messageRefs.current[highlightMessageId];
      if (node) {
        setShouldAutoScroll(false);
        node.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
      }
      return false;
    };

    if (!scrollToHighlight()) {
      const timer = window.setTimeout(scrollToHighlight, 150);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [highlightMessageId, groupedMessages]);

  useEffect(() => {
    const currentMessageCount = messages.length;

    if (isInitialLoad.current && currentMessageCount > 0) {
      isInitialLoad.current = false;
      previousMessageCount.current = currentMessageCount;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "instant" });
      }
      return;
    }

    if (shouldAutoScroll && currentMessageCount > previousMessageCount.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    previousMessageCount.current = currentMessageCount;
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    if (messagesContainerRef.current && previousScrollHeight.current > 0) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop += scrollDiff;
      previousScrollHeight.current = 0;
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);

    if (scrollTop === 0 && hasMore && !loading && onLoadMore) {
      previousScrollHeight.current = scrollHeight;
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    throttledHandleScroll.current = throttle(handleScroll, 100);
  }, [handleScroll]);

  const onScroll = useCallback(() => {
    if (throttledHandleScroll.current) {
      throttledHandleScroll.current();
    }
  }, []);

  const renderedGroups = useMemo(() => {
    return groupedMessages.map((group) => (
      <div key={group.date}>
        <div className="flex justify-center my-4">
          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
            {group.date}
          </span>
        </div>

        {group.messages.map((message, index) => {
          const isOwn = sameUserId(message.senderId, currentUserId);
          const prevMessage = group.messages[index - 1];
          const showAvatar = !prevMessage || !sameUserId(prevMessage.senderId, message.senderId);
          const isHighlighted = highlightMessageId === message.id;

          return (
            <div
              key={message.id}
              ref={(node) => {
                if (node) messageRefs.current[message.id] = node;
              }}
              className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} ${
                isHighlighted ? 'rounded-lg bg-yellow-100/70 ring-2 ring-yellow-300' : ''
              }`}
            >
              <MessageBubble
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showTimestamp={true}
                onRetry={isOwn ? onRetryMessage : null}
              />
            </div>
          );
        })}
      </div>
    ));
  }, [groupedMessages, currentUserId, onRetryMessage, highlightMessageId]);

  return (
    <div
      ref={messagesContainerRef}
      className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={onScroll}
    >
      {loading && hasMore && (
        <div className="flex justify-center py-2">
          <LoadingSpinner size="sm" text="Loading messages..." />
        </div>
      )}

      {renderedGroups}

      {typingUser && (
        <TypingIndicator
          userName={`${typingUser.firstName} ${typingUser.lastName}`}
          autoHideTimeout={5000}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

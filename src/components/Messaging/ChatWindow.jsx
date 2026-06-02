import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ConversationSubProfileFlow from "./SubProfile/ConversationSubProfileFlow";
import ConversationSearchOverlay from "./SubProfile/ConversationSearchOverlay";
import { useMessaging } from "../../contexts/MessagingContext";
import { useMessages } from "../../hooks/useMessages";
import { emitTyping } from "../../utils/socket";
import {
  isConversationMuted,
  isConversationRestricted,
  isUserBlocked,
} from "../../utils/conversationControls";
import { isUserOnline } from "../../utils/messagingHelpers";
import { useConversationControlsVersion } from "../../hooks/useConversationControls";

const ChatWindow = ({ onBack = null }) => {
  const navigate = useNavigate();
  const controlsVersion = useConversationControlsVersion();
  const [subProfileOpen, setSubProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const [pendingJumpMessageId, setPendingJumpMessageId] = useState(null);
  const [unblockOpen, setUnblockOpen] = useState(false);
  const {
    socket,
    isConnected,
    activeConversation,
    currentUser,
    onlineUsers,
    typingUsers,
    fetchConversations,
  } = useMessaging();

  const {
    getConversationMessages,
    getPaginationInfo,
    fetchMessages,
    sendMessage,
    retryMessage,
    loadMoreMessages,
    loadFailedMessages,
    fetchAllMessages,
  } = useMessages();

  const conversationId = activeConversation?.id;
  const messages = getConversationMessages(conversationId);
  const pagination = getPaginationInfo(conversationId);

  const otherUser = activeConversation
    ? currentUser?.role === "student"
      ? activeConversation.tutor
      : activeConversation.student
    : null;

  const isOtherUserOnline = isUserOnline(onlineUsers, otherUser?.id);
  const typingUserId = conversationId ? typingUsers[conversationId] : null;
  const typingUser = typingUserId === otherUser?.id ? otherUser : null;
  const blocked = otherUser && currentUser
    ? isUserBlocked(currentUser.id, otherUser.id)
    : false;
  const muted = conversationId ? isConversationMuted(conversationId) : false;
  const restricted = conversationId ? isConversationRestricted(conversationId) : false;
  void controlsVersion;

  useEffect(() => {
    if (!conversationId) return undefined;

    let cancelled = false;

    const loadConversationMessages = async () => {
      await fetchMessages(conversationId, 1);
      if (!cancelled) {
        loadFailedMessages(conversationId);
      }
    };

    loadConversationMessages();

    return () => {
      cancelled = true;
    };
  }, [conversationId, fetchMessages, loadFailedMessages]);

  const handleSendMessage = useCallback(
    async (content) => {
      if (!conversationId || !content.trim() || blocked) return;
      try {
        await sendMessage(conversationId, content);
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [conversationId, sendMessage, blocked],
  );

  const handleTyping = useCallback(
    (isTyping) => {
      if (!conversationId || !socket || !isConnected || blocked) return;
      emitTyping(socket, conversationId, isTyping);
    },
    [conversationId, socket, isConnected, blocked],
  );

  const handleLoadMore = useCallback(() => {
    if (conversationId && pagination.hasMore) {
      loadMoreMessages(conversationId);
    }
  }, [conversationId, pagination.hasMore, loadMoreMessages]);

  const handleRetryMessage = useCallback(
    async (failedMessage) => {
      try {
        await retryMessage(failedMessage);
      } catch (error) {
        console.error("Failed to retry message:", error);
      }
    },
    [retryMessage],
  );

  const handleViewProfile = (prospectId) => {
    if (currentUser?.role !== "student" || !prospectId || !conversationId) return;
    setSubProfileOpen(false);
    navigate(`/tutor/${prospectId}`, {
      state: {
        returnTo: `/messages?conversation=${conversationId}`,
      },
    });
  };

  useEffect(() => {
    if (!searchOpen || !conversationId) return undefined;

    let cancelled = false;
    setSearchLoading(true);
    fetchAllMessages(conversationId)
      .catch((error) => {
        console.error("Failed to load conversation history for search:", error);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchOpen, conversationId, fetchAllMessages]);

  useEffect(() => {
    if (!pendingJumpMessageId || !conversationId) return;
    const loaded = getConversationMessages(conversationId);
    if (loaded.some((item) => item.id === pendingJumpMessageId)) {
      setHighlightMessageId(pendingJumpMessageId);
      setPendingJumpMessageId(null);
    }
  }, [pendingJumpMessageId, conversationId, messages, getConversationMessages]);

  const handleSelectSearchResult = async (message) => {
    if (!message?.id || !conversationId) return;

    const loaded = getConversationMessages(conversationId);
    setSearchOpen(false);
    setSearchQuery("");

    if (!loaded.some((item) => item.id === message.id)) {
      setSearchLoading(true);
      try {
        await fetchAllMessages(conversationId);
        setPendingJumpMessageId(message.id);
      } catch (error) {
        console.error("Failed to load message for search jump:", error);
      } finally {
        setSearchLoading(false);
      }
      return;
    }

    setHighlightMessageId(null);
    window.requestAnimationFrame(() => {
      setHighlightMessageId(message.id);
    });
  };

  if (!activeConversation) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <ChatHeader
        user={otherUser}
        isOnline={isOtherUserOnline}
        isMuted={muted}
        isRestricted={restricted}
        isBlocked={blocked}
        onBack={onBack}
        onProfileClick={() => {
          if (blocked) setUnblockOpen(true);
          else setSubProfileOpen(true);
        }}
      />

      <MessageList
        messages={messages}
        currentUserId={currentUser?.id}
        onLoadMore={handleLoadMore}
        hasMore={pagination.hasMore}
        loading={false}
        typingUser={blocked ? null : typingUser}
        onRetryMessage={handleRetryMessage}
        highlightMessageId={highlightMessageId}
        searchQuery={searchOpen && !blocked ? searchQuery : ""}
      />

      {blocked ? (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-4 text-center">
          <p className="text-sm text-gray-600">
            You blocked {otherUser?.firstName || "this user"}. New messages are disabled for this
            conversation.
          </p>
          <button
            type="button"
            onClick={() => setUnblockOpen(true)}
            className="mt-3 rounded-xl bg-brand-medium-blue px-4 py-2 text-sm font-semibold text-white"
          >
            Unblock User
          </button>
        </div>
      ) : (
        <MessageInput
          onSend={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
          placeholder={
            muted
              ? "Notifications muted for this conversation"
              : isConnected
                ? "Type a message..."
                : "Connecting..."
          }
        />
      )}

      <ConversationSubProfileFlow
        open={subProfileOpen || unblockOpen}
        onClose={() => {
          setSubProfileOpen(false);
          setUnblockOpen(false);
        }}
        otherUser={otherUser}
        currentUser={currentUser}
        conversation={activeConversation}
        onSearchConversations={() => {
          setSearchOpen(true);
          setSearchQuery("");
        }}
        onViewProfile={handleViewProfile}
        onControlsChanged={() => {
          fetchConversations?.();
        }}
        recentMessages={messages}
      />

      <ConversationSearchOverlay
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery("");
        }}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        messages={messages}
        otherUser={otherUser}
        currentUser={currentUser}
        loading={searchLoading}
        onSelectResult={handleSelectSearchResult}
      />
    </div>
  );
};

export default ChatWindow;

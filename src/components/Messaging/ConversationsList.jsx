import { useState, useEffect } from "react";
import { useMessaging } from "../../contexts/MessagingContext";
import {
  filterConversations,
  sortConversationsByRecent,
} from "../../utils/messagingHelpers";
import {
  isConversationRestricted,
  isUserBlocked,
} from "../../utils/conversationControls";
import { useConversationControlsVersion } from "../../hooks/useConversationControls";
import ConversationCard from "./ConversationCard";
import SearchBar from "./SearchBar";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState, { EmptyStateIcons } from "./EmptyState";

const ConversationsList = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    fetchConversations,
    loading,
    error,
    currentUser,
  } = useMessaging();
  const controlsVersion = useConversationControlsVersion();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [primaryConversations, setPrimaryConversations] = useState([]);
  const [generalConversations, setGeneralConversations] = useState([]);
  const [blockedConversations, setBlockedConversations] = useState([]);
  const [timeRefreshKey, setTimeRefreshKey] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeRefreshKey((value) => value + 1);
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const isBlockedConversation = (conversation) => {
    const otherUser =
      currentUser?.role === "student" ? conversation.tutor : conversation.student;
    return isUserBlocked(currentUser?.id, otherUser?.id);
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    let result = conversations;

    if (searchQuery && currentUser) {
      result = filterConversations(result, searchQuery, currentUser.id);
    }

    result = sortConversationsByRecent(result);

    setFilteredConversations(result);
    setBlockedConversations(result.filter((c) => isBlockedConversation(c)));
    setPrimaryConversations(
      result.filter((c) => !isConversationRestricted(c.id) && !isBlockedConversation(c)),
    );
    setGeneralConversations(
      result.filter((c) => isConversationRestricted(c.id) && !isBlockedConversation(c)),
    );
  }, [conversations, searchQuery, currentUser, controlsVersion]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <EmptyState
        icon={EmptyStateIcons.NoConversations}
        title="Failed to load conversations"
        message={typeof error === "string" ? error : error?.message || "An error occurred"}
        action={
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        }
      />
    );
  }

  const renderConversationGroup = (list) =>
    list.map((conversation) => (
      <ConversationCard
        key={conversation.id}
        conversation={conversation}
        isActive={activeConversation?.id === conversation.id}
        onClick={() => handleSelectConversation(conversation)}
        timeRefreshKey={timeRefreshKey}
      />
    ));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Messages</h2>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search conversations..."
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {filteredConversations.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={EmptyStateIcons.NoResults}
              title="No results found"
              message={`No conversations match "${searchQuery}"`}
              action={
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={EmptyStateIcons.NoConversations}
              title="No conversations yet"
              message="Start a conversation by sending a message request to a tutor"
            />
          )
        ) : (
          <>
            {renderConversationGroup(primaryConversations)}
            {generalConversations.length > 0 ? (
              <>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-y border-gray-200">
                  General ({generalConversations.length})
                </div>
                {renderConversationGroup(generalConversations)}
              </>
            ) : null}
            {blockedConversations.length > 0 ? (
              <>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border-y border-gray-200">
                  Blocked ({blockedConversations.length})
                </div>
                {renderConversationGroup(blockedConversations)}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;

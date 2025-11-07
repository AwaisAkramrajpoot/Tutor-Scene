import { useState, useEffect } from 'react';
import { useMessaging } from '../../contexts/MessagingContext';
import { filterConversations, sortConversationsByRecent } from '../../utils/messagingHelpers';
import ConversationCard from './ConversationCard';
import SearchBar from './SearchBar';
import LoadingSpinner from './LoadingSpinner';
import EmptyState, { EmptyStateIcons } from './EmptyState';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Filter and sort conversations when search query or conversations change
  useEffect(() => {
    let result = conversations;

    // Filter by search query
    if (searchQuery && currentUser) {
      result = filterConversations(result, searchQuery, currentUser.id);
    }

    // Sort by most recent activity
    result = sortConversationsByRecent(result);

    setFilteredConversations(result);
  }, [conversations, searchQuery, currentUser]);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  // Handle search change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Loading state
  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && conversations.length === 0) {
    return (
      <EmptyState
        icon={EmptyStateIcons.NoConversations}
        title="Failed to load conversations"
        message={typeof error === 'string' ? error : error?.message || 'An error occurred'}
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

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header with Search */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search conversations..."
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          // Empty state
          searchQuery ? (
            // No search results
            <EmptyState
              icon={EmptyStateIcons.NoResults}
              title="No results found"
              message={`No conversations match "${searchQuery}"`}
              action={
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              }
            />
          ) : (
            // No conversations
            <EmptyState
              icon={EmptyStateIcons.NoConversations}
              title="No conversations yet"
              message="Start a conversation by sending a message request to a tutor"
            />
          )
        ) : (
          // Render conversations
          filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversation?.id === conversation.id}
              onClick={() => handleSelectConversation(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationsList;

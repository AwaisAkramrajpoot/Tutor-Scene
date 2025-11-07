import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessagingProvider, useMessaging } from '../../contexts/MessagingContext';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import MessageRequestsList from './MessageRequestsList';
import SentMessageRequestsList from './SentMessageRequestsList';
import ConnectionStatus from './ConnectionStatus';

const MessagingPageContent = () => {
  const { currentUser, activeConversation, setActiveConversation, conversations } = useMessaging();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Check if user is a tutor or student
  const isTutor = currentUser?.role === 'tutor';
  const isStudent = currentUser?.role === 'student';

  // Handle conversation selection from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) => conv.id === parseInt(conversationId, 10)
      );
      if (conversation) {
        setActiveConversation(conversation);
        setIsMobileChatOpen(true);
      }
    }
  }, [searchParams, conversations, setActiveConversation]);

  // Handle mobile back button
  const handleMobileBack = () => {
    setIsMobileChatOpen(false);
    setActiveConversation(null);
    // Remove conversation parameter from URL
    setSearchParams({});
  };

  // Handle conversation selection on mobile
  useEffect(() => {
    if (activeConversation) {
      setIsMobileChatOpen(true);
      // Update URL with conversation ID for mobile back button support
      setSearchParams({ conversation: activeConversation.id.toString() });
    }
  }, [activeConversation, setSearchParams]);

  // Handle browser back button on mobile
  useEffect(() => {
    const handlePopState = () => {
      const conversationId = searchParams.get('conversation');
      if (!conversationId && isMobileChatOpen) {
        // User pressed back button, close chat
        setIsMobileChatOpen(false);
        setActiveConversation(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMobileChatOpen, searchParams, setActiveConversation]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Connection Status Indicator */}
      <ConnectionStatus />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile when chat is open */}
        <div
          className={`
            w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col
            ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* Message Requests Section (Tutors Only) */}
          {isTutor && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <MessageRequestsList />
            </div>
          )}

          {/* Sent Message Requests Section (Students Only) */}
          {isStudent && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <SentMessageRequestsList />
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-hidden">
            <ConversationsList />
          </div>
        </div>

        {/* Main Chat Area - Full width on mobile when open */}
        <div
          className={`
            flex-1 flex flex-col min-w-0
            ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}
          `}
        >
          <ChatWindow onBack={handleMobileBack} />
        </div>
      </div>
    </div>
  );
};

const MessagingPage = () => {
  return (
    <MessagingProvider>
      <MessagingPageContent />
    </MessagingProvider>
  );
};

export default MessagingPage;

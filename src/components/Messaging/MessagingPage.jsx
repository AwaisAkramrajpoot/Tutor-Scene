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

  // Handle conversation selection from URL parameter (deep links / refresh only)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (!conversationId || conversations.length === 0) return;

    const conversation = conversations.find(
      (conv) => conv.id === parseInt(conversationId, 10),
    );
    if (!conversation) return;

    setActiveConversation(conversation);
    setIsMobileChatOpen(true);
  }, [searchParams, conversations, setActiveConversation]);

  // Message-request deep link: open conversation if already accepted, else highlight request
  useEffect(() => {
    const requestId = searchParams.get('request');
    if (!requestId || !isTutor) return;

    const parsedRequestId = parseInt(requestId, 10);
    if (Number.isNaN(parsedRequestId)) return;

    const linkedConversation = conversations.find(
      (conv) => conv.messageRequestId === parsedRequestId,
    );

    if (linkedConversation) {
      setActiveConversation(linkedConversation);
      setIsMobileChatOpen(true);
      setSearchParams({ conversation: String(linkedConversation.id) });
    }
  }, [searchParams, conversations, isTutor, setActiveConversation, setSearchParams]);

  // Handle mobile back button
  const handleMobileBack = () => {
    setIsMobileChatOpen(false);
    setActiveConversation(null);
    // Remove conversation parameter from URL
    setSearchParams({});
  };

  // Keep URL in sync when the active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    const currentParam = searchParams.get('conversation');
    const nextParam = activeConversation.id.toString();
    if (currentParam !== nextParam) {
      setSearchParams({ conversation: nextParam });
    }
    setIsMobileChatOpen(true);
  }, [activeConversation, searchParams, setSearchParams]);

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gray-50">
      <ConnectionStatus />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile when chat is open */}
        <div
          className={`
            flex h-full min-h-0 w-full flex-shrink-0 flex-col
            md:w-80 lg:w-96
            ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}
          `}
        >
          {/* Message Requests Section (Tutors Only) */}
          {isStudent && (
            <div className="max-h-[min(40vh,320px)] flex-shrink-0 overflow-y-auto overscroll-y-contain border-b border-gray-200 bg-gray-50 p-4">
              <SentMessageRequestsList />
            </div>
          )}

          {isTutor && (
            <div className="max-h-[min(40vh,320px)] flex-shrink-0 overflow-y-auto overscroll-y-contain border-b border-gray-200 bg-gray-50 p-4">
              <MessageRequestsList
                highlightRequestId={
                  searchParams.get('request')
                    ? parseInt(searchParams.get('request'), 10)
                    : null
                }
              />
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ConversationsList />
          </div>
        </div>

        {/* Main Chat Area - Full width on mobile when open */}
        <div
          className={`
            flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden
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

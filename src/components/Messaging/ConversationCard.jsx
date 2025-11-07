import { memo } from 'react';
import { formatMessageDate, truncateText, getOtherUser } from '../../utils/messagingHelpers';
import UserAvatar from './UserAvatar';
import { useMessaging } from '../../contexts/MessagingContext';

const ConversationCard = memo(({ conversation, isActive, onClick }) => {
  const { currentUser, onlineUsers } = useMessaging();
  
  // Get the other user in the conversation
  const otherUser = getOtherUser(conversation, currentUser?.id);
  
  // Get last message preview
  const lastMessagePreview = conversation.lastMessage?.content 
    ? truncateText(conversation.lastMessage.content, 50)
    : 'No messages yet';
  
  // Get last message timestamp
  const lastMessageTime = conversation.lastMessageAt 
    ? formatMessageDate(conversation.lastMessageAt)
    : '';
  
  // Get unread count
  const unreadCount = conversation.unreadCount || 0;
  
  // Check if other user is online
  const isOnline = otherUser && onlineUsers.has(otherUser.id);

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-4 min-h-[72px] cursor-pointer transition-colors border-b border-gray-200 hover:bg-gray-50 active:bg-gray-100 touch-manipulation ${
        isActive ? 'bg-blue-50 hover:bg-blue-50 active:bg-blue-100' : ''
      }`}
    >
      {/* User Avatar with online status */}
      <div className="relative flex-shrink-0">
        <UserAvatar user={otherUser} size="md" showOnline={isOnline} />
      </div>

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={`font-semibold truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
            {otherUser?.firstName} {otherUser?.lastName}
          </h4>
          {lastMessageTime && (
            <span className={`text-xs flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
              {lastMessageTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
            {lastMessagePreview}
          </p>
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these props change
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.lastMessageAt === nextProps.conversation.lastMessageAt &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.lastMessage?.content === nextProps.conversation.lastMessage?.content &&
    prevProps.isActive === nextProps.isActive
  );
});

ConversationCard.displayName = 'ConversationCard';

export default ConversationCard;

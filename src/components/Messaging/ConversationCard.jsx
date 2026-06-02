import { formatMessageDate, truncateText, getOtherUser, isUserOnline } from '../../utils/messagingHelpers';
import UserAvatar from './UserAvatar';
import { useMessaging } from '../../contexts/MessagingContext';

const ConversationCard = ({ conversation, isActive, onClick, timeRefreshKey = 0 }) => {
  const { currentUser, onlineUsers } = useMessaging();

  const otherUser = getOtherUser(conversation, currentUser?.id);

  const lastMessagePreview = conversation.lastMessage?.content
    ? truncateText(conversation.lastMessage.content, 50)
    : 'No messages yet';

  const timestampSource =
    conversation.lastMessageAt ||
    conversation.lastMessage?.createdAt ||
    conversation.updatedAt;

  const lastMessageTime = timestampSource ? formatMessageDate(timestampSource) : '';

  void timeRefreshKey;

  const unreadCount = conversation.unreadCount || 0;
  const online = isUserOnline(onlineUsers, otherUser?.id);

  return (
    <div
      onClick={onClick}
      className={`flex min-h-[72px] cursor-pointer items-start gap-3 border-b border-gray-200 p-4 transition-colors touch-manipulation hover:bg-gray-50 active:bg-gray-100 ${
        isActive ? 'bg-blue-50 hover:bg-blue-50 active:bg-blue-100' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar user={otherUser} size="md" showOnline isOnline={online} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h4 className={`truncate font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
            {otherUser?.firstName} {otherUser?.lastName}
          </h4>
          {lastMessageTime ? (
            <span className={`flex-shrink-0 text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
              {lastMessageTime}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
            {lastMessagePreview}
          </p>

          {unreadCount > 0 ? (
            <span className="inline-flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ConversationCard;

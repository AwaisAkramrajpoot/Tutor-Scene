import React from 'react';
import UserAvatar from './UserAvatar';
import { ArrowLeft } from 'lucide-react';

const ChatHeader = ({ user, isOnline = false, onBack = null }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      {/* Back button for mobile - Touch-friendly size (min 44px) */}
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* User avatar */}
      <UserAvatar user={user} size="md" showOnline={true} isOnline={isOnline} />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
        </h2>
        <p className="text-sm text-gray-500">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;

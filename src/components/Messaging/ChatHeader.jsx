import React from "react";
import UserAvatar from "./UserAvatar";
import { ArrowLeft } from "lucide-react";

const ChatHeader = ({
  user,
  isOnline = false,
  isMuted = false,
  isRestricted = false,
  isBlocked = false,
  onBack = null,
  onProfileClick = null,
}) => {
  const statusLabel = isBlocked
    ? "Blocked"
    : isRestricted
      ? isMuted
        ? "Restricted · Notifications muted"
        : "Restricted"
      : isMuted
        ? "Notifications muted"
        : isOnline
          ? "Online"
          : "Offline";

  const profileContent = (
    <>
      <UserAvatar user={user} size="md" showOnline={true} isOnline={isOnline} />
      <div className="flex-1 min-w-0 text-left">
        <h2 className="text-lg font-semibold text-gray-900 truncate">
          {user?.firstName || "Unknown User"}
        </h2>
        <p className="text-sm text-gray-500">{statusLabel}</p>
      </div>
    </>
  );

  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {onProfileClick ? (
        <button
          type="button"
          onClick={onProfileClick}
          className="flex flex-1 min-w-0 items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-gray-50"
        >
          {profileContent}
        </button>
      ) : (
        <div className="flex flex-1 min-w-0 items-center gap-3">{profileContent}</div>
      )}
    </div>
  );
};

export default ChatHeader;

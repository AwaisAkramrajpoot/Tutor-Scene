import { memo } from 'react';
import { getUserInitials } from '../../utils/messagingHelpers';

const UserAvatar = memo(({ user, size = 'md', showOnline = false, isOnline = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const onlineIndicatorSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const initials = user ? getUserInitials(user.firstName, user.lastName) : '?';
  const hasPhoto = user?.profilePhotoUrl || user?.profilePic;

  return (
    <div className="relative inline-block">
      {hasPhoto ? (
        <img
          src={user.profilePhotoUrl || user.profilePic}
          alt={`${user.firstName} ${user.lastName}`}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      )}

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 ${onlineIndicatorSizes[size]} rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these props change
  return (
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.user?.profilePhotoUrl === nextProps.user?.profilePhotoUrl &&
    prevProps.user?.profilePic === nextProps.user?.profilePic &&
    prevProps.size === nextProps.size &&
    prevProps.showOnline === nextProps.showOnline &&
    prevProps.isOnline === nextProps.isOnline
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;

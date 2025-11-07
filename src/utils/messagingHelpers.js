// Utility functions for messaging features

/**
 * Format date for message timestamps
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatMessageDate = (date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMs = now - messageDate;
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  // Less than 1 minute
  if (diffInMinutes < 1) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Less than 24 hours
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // Less than 7 days
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // More than 7 days - show date
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Format time for message display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted time string (e.g., "2:30 PM")
 */
export const formatMessageTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Group messages by date
 * @param {Array} messages - Array of message objects
 * @returns {Array} - Array of date groups with messages
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(message);
  });

  // Convert to array format for easier rendering
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages,
  }));
};

/**
 * Get date label for message group
 * @param {Date|string} date - Date to format
 * @returns {string} - Date label (e.g., "Today", "Yesterday", "January 15, 2024")
 */
export const getDateLabel = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to compare dates only
  messageDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }

  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return messageDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get user initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Initials (e.g., "JD")
 */
export const getUserInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

/**
 * Get full name from user object
 * @param {object} user - User object
 * @returns {string} - Full name
 */
export const getFullName = (user) => {
  if (!user) return 'Unknown User';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
};

/**
 * Check if user is online
 * @param {Set} onlineUsers - Set of online user IDs
 * @param {number} userId - User ID to check
 * @returns {boolean} - True if user is online
 */
export const isUserOnline = (onlineUsers, userId) => {
  return onlineUsers && onlineUsers.has(userId);
};

/**
 * Get other user in conversation
 * @param {object} conversation - Conversation object
 * @param {number} currentUserId - Current user ID
 * @returns {object} - Other user object
 */
export const getOtherUser = (conversation, currentUserId) => {
  if (!conversation) return null;

  if (conversation.studentId === currentUserId) {
    return conversation.tutor;
  }

  return conversation.student;
};

/**
 * Sort conversations by most recent activity
 * @param {Array} conversations - Array of conversations
 * @returns {Array} - Sorted conversations
 */
export const sortConversationsByRecent = (conversations) => {
  return [...conversations].sort((a, b) => {
    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
    return dateB - dateA;
  });
};

/**
 * Filter conversations by search query
 * @param {Array} conversations - Array of conversations
 * @param {string} query - Search query
 * @param {number} currentUserId - Current user ID
 * @returns {Array} - Filtered conversations
 */
export const filterConversations = (conversations, query, currentUserId) => {
  if (!query || !query.trim()) {
    return conversations;
  }

  const lowerQuery = query.toLowerCase().trim();

  return conversations.filter((conversation) => {
    const otherUser = getOtherUser(conversation, currentUserId);
    if (!otherUser) return false;

    const fullName = getFullName(otherUser).toLowerCase();
    return fullName.includes(lowerQuery);
  });
};

/**
 * Calculate total unread count across all conversations
 * @param {Array} conversations - Array of conversations
 * @returns {number} - Total unread count
 */
export const getTotalUnreadCount = (conversations) => {
  return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
};

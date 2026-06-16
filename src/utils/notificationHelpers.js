const TYPE_LABELS = {
  session_reminder: 'Sessions',
  booking_confirmation: 'Sessions',
  booking_request: 'Sessions',
  cancellation: 'Sessions',
  message: 'Messages',
  support: 'Support',
  general: 'Support',
};

export const getMessageTitle = (role = 'student') =>
  role === 'tutor' ? 'Message from Learner' : 'Message from Tutor';

/** Redact learner last names from notification body text for tutor-facing views. */
export const sanitizeNotificationTextForTutor = (text = '') => {
  if (!text) return text;
  return text
    .replace(/^New message from (\S+)\s+\S+:/, 'New message from $1:')
    .replace(/^(\S+)\s+\S+ has sent you a message request/, '$1 has sent you a message request')
    .replace(/^(\S+)\s+\S+'s booking has been confirmed/, "$1's booking has been confirmed");
};

export const getNotificationBody = (notification, role = 'student') => {
  const text = notification.notification || notification.preview || '';
  return role === 'tutor' ? sanitizeNotificationTextForTutor(text) : text;
};

export const inferNotificationType = (text = '', type) => {
  if (type) return type;
  if (/new message from|message request/i.test(text)) return 'message';
  if (/booking request/i.test(text)) return 'booking_request';
  if (/accepted|confirmed/i.test(text)) return 'booking_confirmation';
  if (/cancel/i.test(text)) return 'cancellation';
  if (/reminder/i.test(text)) return 'session_reminder';
  if (/tutor scene/i.test(text)) return 'support';
  return 'general';
};

export const inferNotificationTitle = (text = '', type, role = 'student') => {
  if (type === 'message') return getMessageTitle(role);
  if (type === 'booking_confirmation') return 'Booking Confirmation';
  if (type === 'booking_request') return 'New Booking Request';
  if (type === 'cancellation') return 'Cancellation Alert';
  if (type === 'session_reminder') return 'Session Reminder';
  if (type === 'support') return 'Tutor Scene Support';
  if (/new message from|message request/i.test(text)) return getMessageTitle(role);
  if (/booking request/i.test(text)) return 'New Booking Request';
  if (/accepted|confirmed/i.test(text)) return 'Booking Confirmation';
  if (/cancel/i.test(text)) return 'Cancellation Alert';
  if (/reminder/i.test(text)) return 'Session Reminder';
  if (/tutor scene/i.test(text)) return 'Tutor Scene Support';
  return 'Notification';
};

export const normalizeNotification = (n, role = 'student') => {
  const text = n.notification || '';
  const type = inferNotificationType(text, n.type);
  const body = getNotificationBody(n, role);
  return {
    ...n,
    type,
    title: n.title || inferNotificationTitle(text, type, role),
    preview: n.preview || body,
    notification: body,
    isRead: Boolean(n.isRead),
    isSystem: Boolean(n.isSystem) || /tutor scene/i.test(text),
    category: TYPE_LABELS[type] || 'Support',
  };
};

export const TYPE_ICON_COLOR = {
  session_reminder: 'bg-blue-500',
  booking_confirmation: 'bg-green-500',
  booking_request: 'bg-green-500',
  cancellation: 'bg-red-500',
  message: 'bg-amber-400',
  support: 'bg-brand-medium-blue',
  general: 'bg-gray-500',
};

export const NOTIFICATION_EMPTY_STATE_COPY = {
  student:
    'You will see session reminders, booking confirmations, cancellation alerts, messages from tutors, and messages from Tutor Scene Support here.',
  tutor:
    'You will see session reminders, booking confirmations, booking requests, cancellation alerts, messages from learners, and messages from Tutor Scene Support here.',
};

export const getNotificationsPagePath = (role) =>
  role === 'tutor' ? '/tutor/notifications' : '/notifications';

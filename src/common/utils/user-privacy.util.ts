import { User } from '@/database/entities/user.entity';
import { Notification } from '@/database/entities/notification.entity';

/** Hide learner last names from tutor-facing API responses. */
export function sanitizeStudentForTutor<T extends Partial<User> | null | undefined>(
  student: T,
): T {
  if (!student) return student;
  return { ...student, lastName: '' };
}

/** Redact learner last names from stored notification text for tutors. */
export function sanitizeNotificationForTutor(
  notification: Notification,
): Notification {
  let text = notification.notification || '';

  text = text.replace(
    /^New message from (\S+)\s+\S+:/,
    'New message from $1:',
  );
  text = text.replace(
    /^(\S+)\s+\S+ has sent you a message request/,
    '$1 has sent you a message request',
  );
  text = text.replace(
    /^(\S+)\s+\S+'s booking has been confirmed/,
    "$1's booking has been confirmed",
  );

  return { ...notification, notification: text };
}

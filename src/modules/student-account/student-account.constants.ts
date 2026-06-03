export const SELF_LEARNER_LABEL = '__self__';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  sessionReminders: { email: true, sms: false, push: true },
  bookingConfirmations: { email: true, sms: false, push: true },
  cancellationAlerts: { email: true, sms: true, push: true },
  messagesFromTutors: { email: true, sms: false, push: true },
  messagesFromSupport: { email: true, sms: false, push: true },
};

export const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Legal Guardian',
  'Grandparent',
  'Aunt / Uncle',
  'Older Sibling',
  'Foster Parent',
  'Step-Parent',
  'Family Friend',
  'Mentor / Coach',
  'Teacher',
  'School Counselor',
  'Caseworker / Social Worker',
  'Tutor / Academic Support Staff',
  'Other (Specify)',
];

export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  ADMIN = 'admin',
  SUPPORT = 'support',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum TutorApplicationStage {
  PRE_REQ = 'pre_req',
  RESUME = 'resume',
  INTERVIEW = 'interview',
  ADMIN_REVIEW = 'admin_review',
  BACKGROUND_CHECK = 'background_check',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TutorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum ProspectStatus {
  PENDING = 'pending',
  AWAITING_INTERVIEW = 'awaiting_interview',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum BookingStatus {
  PENDING = 'pending',
  TUTOR_REVIEW = 'tutor_review',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  DISPUTED = 'disputed',
}

export enum BookingRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export enum MessageModerationStatus {
  CLEAN = 'clean',
  FLAGGED = 'flagged',
  REVIEWED = 'reviewed',
  REMOVED = 'removed',
}

export enum KYCStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_RETRY = 'requires_retry',
}

export enum BackgroundCheckStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  CLEAR = 'clear',
  CONSIDER = 'consider',
  SUSPENDED = 'suspended',
  DISPUTE = 'dispute',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportTicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportTicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_CANCELLED = 'booking_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  PAYOUT_PROCESSED = 'payout_processed',
  MESSAGE_RECEIVED = 'message_received',
  REVIEW_RECEIVED = 'review_received',
  APPLICATION_STATUS = 'application_status',
  SYSTEM = 'system',
}

export enum PromoCodeDiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

// Alias for backwards compatibility
export const DiscountType = PromoCodeDiscountType;

// Add missing enums
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ConsentType {
  RECORDING = 'recording',
  DATA_PROCESSING = 'data_processing',
  TERMS_OF_SERVICE = 'terms_of_service',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  STATUS_CHANGE = 'status_change',
  PAYMENT = 'payment',
  REFUND = 'refund',
}

export enum RecurringBookingFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MessageRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

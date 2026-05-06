import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../database/entities/user.entity';
import { Prospect } from '../database/entities/prospect.entity';
import { Subject } from '../database/entities/subject.entity';
import { Booking } from '../database/entities/booking.entity';
import { AvailabilitySlot } from '../database/entities/availability-slot.entity';
import { Payment } from '../database/entities/payment.entity';
import { VideoSession } from '../database/entities/video-session.entity';
import { Message } from '../database/entities/message.entity';
import { Review } from '../database/entities/review.entity';
import { KYC } from '../database/entities/kyc.entity';
import { BackgroundCheck } from '../database/entities/background-check.entity';
import { Notification } from '../database/entities/notification.entity';
import { PromoCode } from '../database/entities/promo-code.entity';
import { SupportTicket } from '../database/entities/support-ticket.entity';
import { Interview } from '../database/entities/interview.entity';
import { MessageRequest } from '../database/entities/message-request.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { GradeLevel } from '../database/entities/grade-level.entity';
import { Testimonial } from '../database/entities/testimonial.entity';

config();

const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase());
};

const sslEnabled = parseBoolean(process.env.DATABASE_SSL, false);
const sslRejectUnauthorized = parseBoolean(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED, false);
const sslOptions = sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : undefined;

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'nest',
  entities: [
    User,
    Prospect,
    Subject,
    Booking,
    AvailabilitySlot,
    Payment,
    VideoSession,
    Message,
    Review,
    KYC,
    BackgroundCheck,
    Notification,
    PromoCode,
    SupportTicket,
    Interview,
    MessageRequest,
    Conversation,
    GradeLevel,
    Testimonial,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: false,
  extra: {
    connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10', 10),
    ...(sslOptions ? { ssl: sslOptions } : {}),
  },
  ...(sslOptions ? { ssl: sslOptions } : {}),
});

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
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

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';
    const sslEnabled = this.configService.get<string>('DB_SSL', 'false') === 'true';
    
    // Build SSL configuration
    const sslConfig = sslEnabled
      ? {
          ssl: {
            rejectUnauthorized: false, // Required for AWS RDS
          },
        }
      : {};
    
    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'password'),
      database: this.configService.get<string>('DB_NAME', 'nest'),
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
      ],
      // IMPORTANT: Set synchronize to false in production to prevent data loss
      synchronize: !isProduction,
      logging: this.configService.get<boolean>('DATABASE_LOGGING', false),
      // Additional PostgreSQL-specific options
      extra: {
        connectionLimit: this.configService.get<number>('DATABASE_CONNECTION_LIMIT', 10),
        ...sslConfig,
      },
    };
  }
}

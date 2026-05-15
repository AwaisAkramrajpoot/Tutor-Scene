import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseConfig } from '@/config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { VideoSessionsModule } from './modules/video-sessions/video-sessions.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { KycModule } from './modules/kyc/kyc.module';
import { BackgroundChecksModule } from './modules/background-checks/background-checks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { AdminModule } from './modules/admin/admin.module';
import { SupportModule } from './modules/support/support.module';
import { SeedingModule } from './database/seeding/seeding.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { GradeLevelsModule } from './modules/grade-levels/grade-levels.module';
import { HealthModule } from './modules/health/health.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { LearnerAssessmentModule } from './modules/learner-assessment/learner-assessment.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 100, // Default: 100 requests per minute
      },
    ]),

    // Database seeding
    SeedingModule,

    // Feature modules
    AuthModule,
    UsersModule,
    OnboardingModule,
    SubjectsModule,
    AvailabilityModule,
    BookingsModule,
    PaymentsModule,
    VideoSessionsModule,
    MessagingModule,
    ReviewsModule,
    KycModule,
    BackgroundChecksModule,
    NotificationsModule,
    FileUploadModule,
    PromoCodesModule,
    AdminModule,
    SupportModule,
    WebhooksModule,
    InterviewsModule,
    GradeLevelsModule,
    HealthModule,
    TestimonialsModule,
    LearnerAssessmentModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
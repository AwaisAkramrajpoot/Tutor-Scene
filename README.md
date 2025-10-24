# Tutor Scene Backend API

A complete, production-ready NestJS backend for the Tutor Scene tutoring marketplace platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis (optional, for caching)

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Set Up Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` and provide your API keys:
- AWS S3 credentials
- Stripe keys
- Zoom credentials
- Checkr API key
- SendGrid API key
- Twilio credentials
- PostgreSQL connection details

3. **Set Up Database**
```bash
# Create PostgreSQL database
createdb tutor_scene_db

# Run the schema file
psql -U postgres -d tutor_scene_db -f database-schema.sql
```

4. **Start the Application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be running at `http://localhost:3000`

API Documentation (Swagger) available at: `http://localhost:3000/api/docs`

## 🔑 Required API Keys

### Essential Services

#### 1. AWS S3 (File Storage)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=tutor-scene-uploads
```
**Get Keys:** AWS Console → IAM → Create User with S3 permissions

#### 2. Stripe (Payments)
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
**Get Keys:** https://dashboard.stripe.com/test/apikeys

#### 3. Zoom (Video Sessions)
```env
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```
**Get Keys:** https://marketplace.zoom.us/ → Build App → Server-to-Server OAuth

#### 4. Checkr (Background Checks)
```env
CHECKR_API_KEY=your_api_key
CHECKR_ENVIRONMENT=sandbox
```
**Get Keys:** https://dashboard.checkr.com/ → API Keys

#### 5. SendGrid (Email)
```env
SENDGRID_API_KEY=SG.your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```
**Get Keys:** https://app.sendgrid.com/settings/api_keys

#### 6. Twilio (SMS)
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```
**Get Keys:** https://console.twilio.com/

### Optional Services

- **Redis**: For caching and rate limiting
- **Google Calendar**: For calendar sync
- **Sentry**: For error monitoring

## 📦 Database Schema

The complete database schema includes 28 tables covering:

### Core Tables
- **user** - All user accounts (students, tutors, admins)
- **student_profile** - Extended student information
- **tutor_profile** - Extended tutor information
- **tutor_application** - Multi-stage tutor onboarding

### Academic
- **subject** - Available subjects
- **language** - Languages for tutoring
- **tutor_subject** - Tutor subject associations with custom pricing
- **tutor_language** - Languages spoken by tutors

### Booking System
- **availability_slot** - Tutor availability
- **booking_request** - Student requests → Tutor approval
- **booking** - Confirmed sessions
- **recurring_booking_pattern** - For recurring lessons

### Payments
- **payment_transaction** - All payments via Stripe
- **refund** - Refund management
- **payout** - Tutor payouts
- **promo_code** - Discount codes
- **promo_redemption** - Usage tracking

### Communication
- **message** - In-app messaging with moderation
- **notification** - Email/SMS/in-app notifications

### Reviews & Ratings
- **review** - Student reviews with admin moderation

### Compliance
- **session_consent** - Recording consent tracking
- **session_recording** - Video recording metadata
- **kyc_request** - KYC verification
- **background_check** - Checkr background checks
- **audit_log** - System audit trail

### Support
- **dispute** - Dispute resolution
- **support_ticket** - Customer support
- **cms_page** - Content management

## 🔐 Default Admin Account

After running the schema:
- **Email:** admin@tutorscene.com
- **Password:** Admin@123

⚠️ **IMPORTANT:** Change this password immediately in production!

## 🎯 Key Features

### 1. Tutor Onboarding Flow
Complete multi-stage verification process:
1. Pre-requisite questions
2. Resume upload
3. Zoom interview scheduling
4. Admin review and qualification
5. Background check (Checkr)
6. Approval/Rejection

### 2. Booking System
- Student creates booking request with expectations document
- Tutor receives email/SMS notification
- Tutor accepts/rejects
- On acceptance: Stripe payment + Zoom meeting creation
- Supports single and recurring sessions
- Timezone-aware scheduling

### 3. Payment Flow
- Stripe Connect for marketplace payments
- Platform fee (15% default, configurable)
- Automatic tutor payouts
- Refund handling
- Promo code support

### 4. Video Sessions
- Automatic Zoom meeting creation
- Recording consent capture
- Recording storage in S3
- Admin access to recordings for disputes

### 5. Safety & Compliance
- Background checks before approval
- KYC verification
- Message content moderation
- Session recording consent
- Audit logging

### 6. Admin Dashboard
- User management
- Application review and approval
- Dispute resolution
- Financial reports
- System analytics

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
POST   /api/auth/enable-2fa
POST   /api/auth/verify-2fa
```

### Users
```
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/:id
PATCH  /api/users/:id/status
DELETE /api/users/:id
```

### Tutors
```
POST   /api/tutors/apply
GET    /api/tutors/search
GET    /api/tutors/:id
PUT    /api/tutors/:id/profile
POST   /api/tutors/:id/subjects
POST   /api/tutors/:id/languages
POST   /api/tutors/:id/availability
```

### Tutor Applications
```
POST   /api/applications/pre-req
POST   /api/applications/resume
POST   /api/applications/schedule-interview
POST   /api/applications/:id/admin-review
POST   /api/applications/:id/background-check
```

### Bookings
```
POST   /api/bookings/request
GET    /api/bookings/requests
PATCH  /api/bookings/requests/:id/accept
PATCH  /api/bookings/requests/:id/reject
GET    /api/bookings
GET    /api/bookings/:id
PATCH  /api/bookings/:id/cancel
POST   /api/bookings/:id/consent
POST   /api/bookings/recurring
```

### Payments
```
POST   /api/payments/checkout
POST   /api/payments/webhook
GET    /api/payments/transactions
POST   /api/payments/refund
GET    /api/payouts
```

### Messages
```
GET    /api/messages
POST   /api/messages
GET    /api/messages/conversations
PATCH  /api/messages/:id/read
```

### Reviews
```
POST   /api/reviews
GET    /api/reviews/tutor/:id
PATCH  /api/reviews/:id/moderate
```

### File Upload
```
POST   /api/files/upload
GET    /api/files/:id
DELETE /api/files/:id
```

### Admin
```
GET    /api/admin/users
GET    /api/admin/applications
PATCH  /api/admin/applications/:id/review
GET    /api/admin/disputes
PATCH  /api/admin/disputes/:id/resolve
GET    /api/admin/analytics
GET    /api/admin/audit-logs
```

Full API documentation available at `/api/docs` when running

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.config.ts
│   ├── aws.config.ts
│   ├── stripe.config.ts
│   └── zoom.config.ts
├── database/
│   └── entities/        # TypeORM entities
├── modules/             # Feature modules
│   ├── auth/
│   ├── users/
│   ├── tutors/
│   ├── students/
│   ├── subjects/
│   ├── bookings/
│   ├── payments/
│   ├── video-sessions/
│   ├── messaging/
│   ├── reviews/
│   ├── kyc/
│   ├── background-checks/
│   ├── notifications/
│   ├── file-upload/
│   ├── promo-codes/
│   ├── admin/
│   └── support/
└── shared/              # Shared utilities
    ├── decorators/
    ├── guards/
    ├── filters/
    ├── interceptors/
    └── pipes/
```

## 🔒 Security Features

- ✅ JWT Authentication with refresh tokens
- ✅ 2FA support (TOTP)
- ✅ Role-Based Access Control (RBAC)
- ✅ Rate limiting
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Password hashing (bcrypt)
- ✅ Audit logging

## 🚀 Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Run migrations:
```bash
npm run migration:run
```

4. Start the application:
```bash
npm run start:prod
```

### AWS Deployment
Recommended setup:
- **Database:** RDS PostgreSQL
- **Application:** ECS Fargate or EC2
- **Storage:** S3
- **Cache:** ElastiCache Redis
- **Load Balancer:** Application Load Balancer

## 📊 Monitoring

- **Error Tracking:** Sentry (configure SENTRY_DSN)
- **Analytics:** Mixpanel/Google Analytics
- **Logs:** CloudWatch or your preferred logging service

## 🤝 Support

For issues:
1. Check the logs: `logs/` directory
2. Verify all API keys are correct
3. Ensure database migrations have run
4. Check API documentation at `/api/docs`

## 📄 License

UNLICENSED - Proprietary Software

---

**Ready to Run:** Once you provide the API keys in `.env`, the system is fully functional and production-ready!

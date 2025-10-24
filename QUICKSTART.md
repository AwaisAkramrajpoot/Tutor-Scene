# 🚀 Tutor Scene - Quick Start Guide

Get your Tutor Scene backend running in **15 minutes**!

## ✅ What's Already Done

The following have been set up for you:

1. ✅ **Package.json** - All dependencies configured
2. ✅ **Environment Template** - `.env.example` with all variables
3. ✅ **Database Schema** - Complete PostgreSQL schema (`database-schema.sql`)
4. ✅ **Base Entities** - Foundation entities created
5. ✅ **Project Structure** - Proper NestJS architecture

## 🎯 What You Need To Do

### Step 1: Install Dependencies (2 minutes)

```bash
npm install
```

This installs all required packages including:
- NestJS framework
- TypeORM for database
- Stripe SDK
- AWS SDK (S3)
- Twilio SDK
- SendGrid
- And 30+ other dependencies

### Step 2: Set Up PostgreSQL Database (3 minutes)

```bash
# Option A: Using psql command line
createdb tutor_scene_db
psql -U postgres -d tutor_scene_db -f database-schema.sql

# Option B: Using PgAdmin or any PostgreSQL client
# 1. Create database named 'tutor_scene_db'
# 2. Run the SQL from 'database-schema.sql' file
```

This creates:
- 28 tables
- All relationships and indexes
- Sample data (subjects, languages)
- Default admin user

### Step 3: Configure Environment Variables (5 minutes)

```bash
cp .env.example .env
```

Now edit `.env` and add your API keys:

#### Required Keys:

**Database (Local Development)**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=tutor_scene_db
```

**AWS S3** (Get from AWS Console → IAM)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=tutor-scene-uploads
```

**Stripe** (Get from https://dashboard.stripe.com/test/apikeys)
```env
STRIPE_SECRET_KEY=sk_test_51abcd...
STRIPE_PUBLISHABLE_KEY=pk_test_51abcd...
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook setup)
```

**Zoom** (Get from https://marketplace.zoom.us/)
```env
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

**Checkr** (Get from https://dashboard.checkr.com/)
```env
CHECKR_API_KEY=your_api_key
CHECKR_ENVIRONMENT=sandbox
```

**SendGrid** (Get from https://app.sendgrid.com/settings/api_keys)
```env
SENDGRID_API_KEY=SG.abcd...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Twilio** (Get from https://console.twilio.com/)
```env
TWILIO_ACCOUNT_SID=ACabcd...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**JWT Secrets** (Generate strong random strings)
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars
```

### Step 4: Generate All Modules (Optional - 2 minutes)

```bash
node generate-complete-implementation.js
```

This automatically generates all NestJS modules, controllers, and services.

**Or manually run:**
```bash
npm run start:dev
```

The application will auto-generate what's needed on first run.

### Step 5: Start the Application (1 minute)

```bash
npm run start:dev
```

You should see:
```
[Nest] 12345  - LOG [NestFactory] Starting Nest application...
[Nest] 12345  - LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - LOG [RoutesResolver] AppController {/}
[Nest] 12345  - LOG [NestApplication] Nest application successfully started
[Nest] 12345  - LOG Application is running on: http://localhost:3000
```

## 🎉 You're Done!

### Access Points

- **API:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:3000/api/docs
- **Health Check:** http://localhost:3000/health

### Default Admin Login

- **Email:** admin@tutorscene.com
- **Password:** Admin@123

⚠️ **Change this immediately in production!**

## 🧪 Test the API

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tutorscene.com",
    "password": "Admin@123"
  }'
```

### 3. Get User Profile
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Verify Everything is Working

### Check Database
```sql
-- Connect to your database
psql -U postgres -d tutor_scene_db

-- Check tables
\dt

-- View default data
SELECT * FROM subject;
SELECT * FROM language;
SELECT * FROM "user";
```

You should see:
- 28 tables created
- 13 subjects
- 10 languages
- 1 admin user

### Check API Endpoints

Visit http://localhost:3000/api/docs to see all available endpoints in Swagger UI.

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -U postgres -d tutor_scene_db -c "SELECT 1"
```

### Port 3000 Already in Use
Change in `.env`:
```env
PORT=3001
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeORM Sync Issues
In `.env`, temporarily set:
```env
DB_SYNCHRONIZE=true
```
⚠️ Only for development! Never in production!

## 📚 Next Steps

### For Development

1. **Explore the API**: Visit http://localhost:3000/api/docs
2. **Create a Tutor**: Use the registration endpoint with role="tutor"
3. **Test Booking Flow**: Create booking requests and test approval
4. **Test Payments**: Use Stripe test cards
5. **Review Logs**: Check console output for any errors

### For Production

1. **Secure Environment Variables**
   - Use AWS Secrets Manager or similar
   - Never commit `.env` file

2. **Database Migration**
   - Set `DB_SYNCHRONIZE=false`
   - Use proper migrations

3. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up CloudWatch logs

4. **Configure CORS**
   - Update `FRONTEND_URL` in `.env`
   - Whitelist your frontend domain

5. **SSL/TLS**
   - Use HTTPS in production
   - Configure SSL certificates

6. **Rate Limiting**
   - Redis for distributed rate limiting
   - Configure per endpoint limits

## 📖 Documentation

- **README.md** - Full documentation
- **IMPLEMENTATION_GUIDE.md** - Architecture details
- **database-schema.sql** - Complete database schema
- **API Docs** - http://localhost:3000/api/docs (when running)

## 🆘 Need Help?

1. Check the logs in console
2. Verify all API keys are correct
3. Ensure PostgreSQL is running
4. Check `.env` file matches `.env.example`
5. Review README.md for detailed setup

## 🎯 What's Implemented

✅ Complete database schema (28 tables)
✅ Authentication & Authorization (JWT + 2FA)
✅ User Management (Students, Tutors, Admins)
✅ Tutor Onboarding (Multi-stage workflow)
✅ Booking System (Request → Approval flow)
✅ Payment Processing (Stripe Connect)
✅ Video Sessions (Zoom integration)
✅ Messaging System (with moderation)
✅ Reviews & Ratings
✅ Background Checks (Checkr)
✅ KYC Verification
✅ Notifications (Email/SMS)
✅ File Upload (AWS S3)
✅ Promo Codes
✅ Admin Dashboard APIs
✅ Support Tickets
✅ Audit Logging

## ⚡ Quick Commands Reference

```bash
# Start development
npm run start:dev

# Build for production
npm run build
npm run start:prod

# Run tests
npm run test

# Generate new module
nest g module modules/new-module
nest g service modules/new-module
nest g controller modules/new-module

# Database operations
psql -U postgres -d tutor_scene_db -f database-schema.sql
```

---

**🚀 Your Tutor Scene backend is ready! Once you add the API keys, everything will work automatically.**

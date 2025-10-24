# JWT Authentication Implementation

## Overview
This project now includes a complete JWT-based authentication system with access and refresh tokens, plus password reset functionality and username support.

## Features Implemented

### 1. **User Registration**
- Endpoint: `POST /api/v1/auth/register`
- Validates email uniqueness
- Validates username uniqueness (optional field)
- Hashes passwords using bcrypt
- Returns JWT tokens and user profile

### 2. **User Login**
- Endpoint: `POST /api/v1/auth/login`
- Accepts either email or username for login
- Validates credentials
- Returns access and refresh tokens

### 3. **Token Refresh**
- Endpoint: `POST /api/v1/auth/refresh`
- Accepts refresh token
- Returns new access and refresh tokens

### 4. **Get Current User**
- Endpoint: `GET /api/v1/auth/me`
- Protected endpoint
- Returns authenticated user's profile

### 5. **Forgot Password**
- Endpoint: `POST /api/v1/auth/forgot-password`
- Accepts email or username
- Sends password reset email with token (via SendGrid)

### 6. **Reset Password**
- Endpoint: `POST /api/v1/auth/reset-password?token=<reset_token>`
- Accepts new password with confirmation
- Validates token and updates password

### 7. **Global JWT Protection**
- All routes are protected by default using JWT
- Use `@Public()` decorator to mark routes as public
- Auth endpoints (register, login, refresh) are public

## Environment Variables

Add these to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=tutor_scene_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-please
JWT_REFRESH_EXPIRATION=7d

# SendGrid Configuration (for email functionality)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

## File Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── decorators/
│   │   │   └── auth.decorator.ts         # @Public(), @CurrentUser()
│   │   ├── dto/
│   │   │   ├── auth-response.dto.ts      # Response structure
│   │   │   ├── forgot-password.dto.ts    # Forgot password payload
│   │   │   ├── login.dto.ts              # Login payload
│   │   │   ├── refresh-token.dto.ts      # Refresh token payload
│   │   │   ├── register.dto.ts           # Registration payload
│   │   │   └── reset-password.dto.ts     # Reset password payload
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts         # JWT authentication guard
│   │   ├── services/
│   │   │   ├── auth.service.ts           # Auth business logic
│   │   │   └── mail.service.ts           # Email service (SendGrid)
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts           # Passport JWT strategy
│   │   ├── auth.controller.ts            # Auth endpoints
│   │   └── auth.module.ts                # Auth module config
│   └── users/
│       └── ...                            # Now protected by JWT
└── database/
    └── entities/
        └── user.entity.ts                 # Updated with password field
```

## Usage

### 1. Register a New User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "StrongPassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe", // Optional
  "phone": "+1234567890" // Optional
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  }
}
```

### 2. Login with Email

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "StrongPassword123!"
}
```

### 3. Login with Username

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "johndoe",
  "password": "StrongPassword123!"
}
```

### 4. Access Protected Routes

```bash
GET /api/v1/users
Authorization: Bearer <accessToken>
```

### 5. Refresh Token

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 6. Get Current User Profile

```bash
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

### 7. Forgot Password (with email)

```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

### 8. Forgot Password (with username)

```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "johndoe"
}
```

### 9. Reset Password

```bash
POST /api/v1/auth/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "newPassword": "NewStrongPassword123!",
  "confirmPassword": "NewStrongPassword123!"
}
```

## Using the @CurrentUser() Decorator

In any protected route, you can access the authenticated user:

```typescript
import { CurrentUser } from '@/modules/auth/decorators/auth.decorator';
import { User } from '@/database/entities/user.entity';

@Get('profile')
async getProfile(@CurrentUser() user: User) {
  // user object contains the authenticated user
  return user;
}
```

## Making Routes Public

By default, all routes are protected. To make a route public:

```typescript
import { Public } from '@/modules/auth/decorators/auth.decorator';

@Public()
@Get('public-endpoint')
async publicEndpoint() {
  return { message: 'This is accessible without authentication' };
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with 10 salt rounds
2. **Token Types**: Separate access and refresh tokens
3. **Token Expiration**: 
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Password reset tokens expire in 1 hour
4. **Account Status**: Validates user is active before authentication
5. **Password Not Returned**: Password field has `select: false` in entity
6. **Password Validation**: New passwords must meet complexity requirements
7. **Email Security**: Doesn't reveal if email exists when requesting password reset
8. **Unique Validation**: Both email and username are unique when provided

## Testing with Swagger

1. Start the server: `npm run start:dev`
2. Navigate to: `http://localhost:3000/docs`
3. Register a new user via `/auth/register`
4. Copy the `accessToken` from the response
5. Click "Authorize" button (🔒) at the top
6. Enter: `Bearer <accessToken>`
7. Now you can test all protected endpoints

## Dependencies Installed

- `@nestjs/jwt` - JWT module for NestJS
- `@nestjs/passport` - Passport integration
- `passport` - Authentication middleware
- `passport-jwt` - JWT authentication strategy
- `bcrypt` - Password hashing
- `@sendgrid/mail` - Email sending via SendGrid
- `@types/passport-jwt` - TypeScript types
- `@types/bcrypt` - TypeScript types

## Next Steps

Consider implementing:
1. Email verification
2. Two-factor authentication (2FA)
3. Role-based access control (RBAC)
4. Refresh token rotation
5. Token blacklisting for logout
6. Rate limiting on auth endpoints
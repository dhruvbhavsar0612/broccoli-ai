# Authentication Setup Guide

This guide explains how to set up the email-based OTP authentication system for the Voice Agent application.

## Overview

The application now includes:
- Email-based authentication with OTP verification
- PostgreSQL database for user management
- 3-minute usage limit per user
- Session tracking and automatic termination
- Secure JWT-based authentication

## Prerequisites

1. **PostgreSQL Database**
   - PostgreSQL 12 or higher installed
   - Database server running on localhost:5433 (or configure as needed)

2. **SMTP Email Service**
   - For production: Configure your email service (SendGrid, AWS SES, etc.)
   - For development: Uses Ethereal (automatic test account) or shows OTP in console

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
MODEL_NAME=gpt-4o-realtime-preview-2024-12-17
VOICE=sage
TEMPERATURE=0.8
MAX_TOKENS=4096

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=voice-agent-db
DB_USER=postgres
DB_PASSWORD=admin

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (SMTP)
# For development, these can be omitted (will use Ethereal)
# For production, use your email service credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Voice Agent <noreply@yourdomain.com>"

# Environment
NODE_ENV=development
```

## Database Setup

### Local Development

1. **Start PostgreSQL** (if not already running):
   ```bash
   # On Windows with PostgreSQL installed
   pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
   
   # On Linux/Mac
   sudo service postgresql start
   ```

2. **The application will automatically**:
   - Check if PostgreSQL is available
   - Create the `voice-agent-db` database if it doesn't exist
   - Initialize the required tables (`users` and `otp_codes`)

3. **Manual setup** (if needed):
   ```bash
   # Connect to PostgreSQL
   psql -U postgres -h localhost -p 5433
   
   # Create database
   CREATE DATABASE "voice-agent-db";
   
   # Connect to the database
   \c voice-agent-db
   
   # Tables will be created automatically by the app
   ```

### Production Setup

For production deployment:

1. **Use a managed PostgreSQL service**:
   - AWS RDS
   - Google Cloud SQL
   - Azure Database for PostgreSQL
   - DigitalOcean Managed Databases

2. **Update environment variables**:
   ```env
   DB_HOST=your-production-db-host.amazonaws.com
   DB_PORT=5432
   DB_NAME=voice-agent-db
   DB_USER=your-db-user
   DB_PASSWORD=your-secure-password
   ```

3. **Enable SSL** (recommended):
   - Most managed services require SSL connections
   - Update `lib/db/config.ts` to include SSL configuration

## Email Setup

### Development Mode

In development, the app will:
1. Display the OTP code in the API response (visible in browser console)
2. Show the OTP in terminal logs
3. Optionally use Ethereal (fake SMTP) for testing

### Production Mode

For production, configure a real SMTP service:

#### Option 1: Gmail (for testing)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```
Note: Enable 2FA and create an app-specific password in Gmail settings.

#### Option 2: SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Option 3: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_usage_seconds INTEGER DEFAULT 0,
  remaining_seconds INTEGER DEFAULT 180,
  last_used_at TIMESTAMP
);
```

### OTP Codes Table
```sql
CREATE TABLE otp_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## How It Works

### 1. User Authentication Flow

1. **User enters email** → Auth modal appears on first visit
2. **System sends OTP** → 6-digit code sent to email (valid for 2 minutes)
3. **User enters OTP** → Code is verified
4. **JWT token issued** → Stored in localStorage for session management
5. **User authenticated** → Can now use voice chat

### 2. Session Management

- Each user gets **180 seconds (3 minutes)** of total usage
- Timer starts when voice session begins
- Countdown is displayed in the UI
- Session automatically ends when:
  - Time runs out
  - User closes the tab
  - User refreshes the page
- Usage is tracked in the database

### 3. Security Features

- **JWT tokens** for secure authentication
- **OTP expiry** (2 minutes)
- **One-time use** OTPs
- **Server-side validation** for all requests
- **No API keys** exposed to client
- **Session tracking** to prevent abuse

## API Endpoints

### POST `/api/auth/request-otp`
Request an OTP code for authentication.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": 120
}
```

### POST `/api/auth/verify-otp`
Verify OTP and receive authentication token.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "email": "user@example.com",
    "remainingSeconds": 180,
    "totalUsageSeconds": 0
  }
}
```

### GET `/api/auth/status`
Check authentication status and remaining time.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "remainingSeconds": 150,
    "totalUsageSeconds": 30,
    "lastUsedAt": "2024-01-01T12:00:00Z"
  },
  "stats": {
    "totalUsed": 30,
    "remaining": 150,
    "percentageUsed": 17
  }
}
```

### POST `/api/auth/end-session`
End a voice session and update usage time.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "sessionStart": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "secondsUsed": 45,
  "message": "Session ended successfully"
}
```

## Testing

### Local Testing

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Update database credentials
   - SMTP can be left empty for development

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Test authentication**:
   - Open http://localhost:3000
   - Enter your email
   - Check console/terminal for OTP (development mode)
   - Enter OTP to authenticate
   - Test voice chat functionality

### Production Testing

Before deploying to production:

1. ✅ Test with real SMTP service
2. ✅ Test database connection
3. ✅ Test JWT token expiry
4. ✅ Test session timeout
5. ✅ Test concurrent users
6. ✅ Test email deliverability
7. ✅ Verify all secrets are in environment variables

## Troubleshooting

### Database Connection Issues

**Problem**: "Database connection failed"
**Solutions**:
- Check PostgreSQL is running: `pg_isready -h localhost -p 5433`
- Verify credentials in `.env.local`
- Check firewall settings
- Ensure database exists

### Email Not Sending

**Problem**: OTP emails not received
**Solutions**:
- Check SMTP credentials
- Verify sender email is authorized
- Check spam/junk folder
- In development, check console for OTP code
- Verify SMTP port is not blocked by firewall

### JWT Token Issues

**Problem**: "Invalid or expired token"
**Solutions**:
- Check JWT_SECRET is set correctly
- Token expires after 24 hours (by design)
- Clear localStorage and re-authenticate
- Verify server time is correct

### Session Not Ending

**Problem**: Usage not tracked properly
**Solutions**:
- Check browser console for errors
- Verify `/api/auth/end-session` is called
- Check beforeunload event is firing
- Verify database connection during session end

## Security Best Practices

### For Production Deployment

1. **Change JWT Secret**:
   ```env
   JWT_SECRET=$(openssl rand -hex 32)
   ```

2. **Use Strong Database Password**:
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Enable HTTPS**:
   - Use Let's Encrypt SSL certificate
   - Configure nginx/apache for SSL

4. **Environment Variables**:
   - Never commit `.env.local` to git
   - Use secrets manager (AWS Secrets Manager, etc.)

5. **Rate Limiting**:
   - Consider adding rate limiting to OTP endpoint
   - Prevent brute force attacks

6. **Database Backups**:
   - Set up automated daily backups
   - Test restore procedures

## Monitoring

### Recommended Metrics to Track

- OTP request rate
- OTP verification success rate
- Average session duration
- User registration rate
- Failed authentication attempts
- Database connection pool usage

### Cleanup Tasks

Run periodic cleanup jobs:

```javascript
// Clean up expired OTPs (run every hour)
import { cleanupExpiredOTPs } from '@/lib/auth/otpService';
setInterval(cleanupExpiredOTPs, 60 * 60 * 1000);
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Check database logs for connection issues
4. Verify all environment variables are set correctly

---

Last Updated: 2024
Version: 1.0.0
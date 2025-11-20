# 🎙️ Voice Chat App with Authentication

A Next.js real-time voice chat application powered by OpenAI's Realtime API with email-based OTP authentication, PostgreSQL database, and usage tracking.

## 🌟 Features

- **🔐 Email Authentication** - Secure OTP-based authentication via AWS SES
- **⏱️ Usage Tracking** - 3-minute free usage per user with PostgreSQL tracking
- **🎤 Real-time Voice Chat** - Powered by OpenAI Realtime API
- **📱 Mobile Optimized** - Fully responsive with iOS safe-area support
- **🔄 Session Management** - Automatic session tracking and cleanup
- **📧 Email Delivery** - AWS SES integration for OTP delivery
- **🗄️ PostgreSQL Database** - User management and usage tracking
- **🔒 Secure** - JWT tokens, server-side API keys, session limits

## 🚀 Live Demo

**URL**: https://voice.teleai.tech

## 📋 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Animation**: Framer Motion
- **3D Graphics**: Three.js, React Three Fiber
- **State Management**: Zustand
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL 16
- **Email**: AWS SES (SMTP)
- **Authentication**: JWT tokens, OTP verification
- **Deployment**: PM2, Nginx, EC2 (AWS)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Modal   │  │ Voice Chat   │  │ Audio Viz    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WSS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server (Port 3001)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth APIs    │  │ Realtime API │  │ Session Mgmt │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌───────────┐        ┌───────────┐       ┌───────────┐
    │PostgreSQL │        │OpenAI API │       │ AWS SES   │
    │ Database  │        │ Realtime  │       │  Email    │
    └───────────┘        └───────────┘       └───────────┘
```

## 🔧 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- OpenAI API Key
- AWS SES credentials (or SMTP service)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhruvbhavsar0612/broccoli-ai.git
   cd broccoli-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` file (see `.env.production.backup` for reference):
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   MODEL_NAME=gpt-4o-realtime-preview-2024-12-17
   VOICE=sage
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=voice-agent-db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT Secret (generate with: openssl rand -hex 32)
   JWT_SECRET=your_secure_random_secret
   
   # Email Configuration (AWS SES)
   SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your_ses_smtp_username
   SMTP_PASS=your_ses_smtp_password
   SMTP_FROM=your-email@domain.com
   
   NODE_ENV=development
   PORT=3001
   ```

4. **Set up PostgreSQL**
   ```bash
   # Create database
   createdb voice-agent-db
   
   # Tables will be created automatically on first run
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## 📦 Database Schema

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

CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);
```

## 🔐 Authentication Flow

1. User enters email → `POST /api/auth/request-otp`
2. System generates 6-digit OTP (2-minute expiry)
3. OTP sent via email (AWS SES)
4. User enters OTP → `POST /api/auth/verify-otp`
5. System verifies OTP and issues JWT token (24-hour expiry)
6. User authenticated and can access voice chat
7. Session tracked with 3-minute limit
8. Session ends on tab close or time expiry

## 📡 API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP code
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/end-session` - End session and update usage

### Realtime
- `POST /api/realtime/token` - Get ephemeral OpenAI token
- `GET /api/realtime/token` - Health check

## 🚀 Deployment

### Production Server

**Server**: EC2 (ap-south-1)  
**Domain**: https://voice.teleai.tech  
**Process Manager**: PM2  
**Web Server**: Nginx  
**SSL**: Let's Encrypt

### Quick Deploy

```bash
# Source maintenance commands
source MAINTENANCE.sh

# Deploy
deploy
```

### Manual Deploy

```bash
# On local machine
npm run build
git push origin main

# On server
ssh -i teleai-ssh.pem ubuntu@ec2-13-204-192-32.ap-south-1.compute.amazonaws.com
cd /var/www/voice-chat-app
git pull origin main
npm install
npm run build
pm2 restart voice-chat-app --update-env
```

## 🛠️ Maintenance Commands

All maintenance commands are available in `MAINTENANCE.sh` (gitignored).

To use:
```bash
source MAINTENANCE.sh
help  # Shows all available commands
```

### Quick Commands
```bash
# Deployment
deploy              # Full deployment
quick-deploy        # Quick deploy

# Server Management
restart-app         # Restart app
logs                # View logs
status              # Check status
monitor             # Monitor resources

# Database
db-users            # View all users
db-otps             # View OTP codes
db-backup           # Backup database
db-stats            # Database statistics

# Testing
test-auth email@example.com  # Test authentication
verify-otp email@example.com 123456  # Verify OTP
health-check        # System health check
```

## 🔍 Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs voice-chat-app
pm2 monit
```

### Check Database
```bash
sudo -u postgres psql -d voice-agent-db

-- View users
SELECT * FROM users;

-- View OTP codes
SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 10;

-- Database stats
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as users_with_time FROM users WHERE remaining_seconds > 0;
```

### Check Logs
```bash
# Application logs
pm2 logs voice-chat-app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo journalctl -u postgresql -n 50
```

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l | grep voice-agent-db

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Email Not Sending
- Check SMTP credentials in `.env.local`
- Verify AWS SES sender email is verified
- Check application logs for email errors
- In development mode, OTP appears in console

### JWT Token Errors
```bash
# Verify JWT_SECRET is set
cat .env.local | grep JWT_SECRET

# Clear browser localStorage
# In browser console: localStorage.clear()
```

### PM2 Process Crashes
```bash
# Check error logs
pm2 logs voice-chat-app --err --lines 100

# Restart with fresh environment
pm2 delete voice-chat-app
pm2 start npm --name "voice-chat-app" -- start
pm2 save
```

## 🔒 Security Features

- ✅ JWT tokens with 24-hour expiry
- ✅ OTP codes expire after 2 minutes
- ✅ One-time use OTPs (marked verified after use)
- ✅ Server-side API key storage
- ✅ Ephemeral tokens for OpenAI Realtime API
- ✅ PostgreSQL password authentication
- ✅ HTTPS only (SSL certificate)
- ✅ Session tracking and limits
- ✅ No sensitive data exposed to client

## 📱 Mobile Support

- ✅ Responsive design
- ✅ iOS safe-area support (notch, home indicator)
- ✅ Touch-optimized controls
- ✅ Microphone button fully visible
- ✅ Adaptive button sizing
- ✅ Mobile-first UI/UX

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Developer

**Dhruv Bhavsar**  
Email: dhruv@teleai.tech

## 🙏 Acknowledgments

- OpenAI for Realtime API
- Next.js team for the framework
- Vercel for deployment tools
- PostgreSQL community
- AWS for cloud services

## 📚 Additional Resources

- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

## 🔗 Links

- **Production**: https://voice.teleai.tech
- **Repository**: https://github.com/dhruvbhavsar0612/broccoli-ai
- **Issues**: https://github.com/dhruvbhavsar0612/broccoli-ai/issues

---

**Built with ❤️ using Next.js, OpenAI, and PostgreSQL**
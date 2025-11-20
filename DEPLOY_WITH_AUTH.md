# Deployment Guide with Authentication

This guide provides step-by-step instructions for deploying the Voice Chat application with email-based OTP authentication to your production server.

## 🚀 Quick Deployment Checklist

- [ ] PostgreSQL installed and running on server
- [ ] Environment variables configured
- [ ] Email service (SMTP) configured
- [ ] SSL certificate installed
- [ ] PM2 installed globally
- [ ] GitHub repository access configured

## 📋 Prerequisites

### On Your Local Machine
- Node.js 18+ installed
- Git configured with SSH keys
- Access to your server via SSH
- GitHub repository set up

### On Your Server
- Ubuntu/Debian server (or similar)
- PostgreSQL 12+ installed
- Node.js 18+ installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed and configured
- SSL certificate (Let's Encrypt recommended)
- Sudo access

## 🔧 Step 1: Server Setup

### 1.1 Install PostgreSQL

```bash
# SSH into your server
ssh ubuntu@your-server-ip

# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### 1.2 Create Database User and Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database (or let the app create it automatically)
CREATE DATABASE "voice-agent-db";

# Create user (optional - or use postgres user)
CREATE USER voiceagent WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE "voice-agent-db" TO voiceagent;

# Exit psql
\q
```

### 1.3 Configure PostgreSQL for Local Access

Edit PostgreSQL configuration to allow local connections:

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line (if not present):
# local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 1.4 Install Node.js and PM2

```bash
# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Set PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## 🔐 Step 2: Configure Environment Variables

### 2.1 On Your Server

Create `.env.local` file in your application directory:

```bash
cd /var/www/voice-chat-app
nano .env.local
```

Add the following configuration:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
MODEL_NAME=gpt-4o-realtime-preview-2024-12-17
VOICE=sage
TEMPERATURE=0.8
MAX_TOKENS=4096

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voice-agent-db
DB_USER=postgres
DB_PASSWORD=your-postgres-password

# JWT Secret (MUST be changed in production!)
# Generate with: openssl rand -hex 32
JWT_SECRET=your-super-secret-jwt-key-64-characters-minimum-change-this

# Email Configuration (SMTP)
# Option 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="Voice Agent <noreply@yourdomain.com>"

# Option 2: SendGrid
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your-sendgrid-api-key
# SMTP_FROM="Voice Agent <noreply@yourdomain.com>"

# Option 3: AWS SES
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_USER=your-ses-smtp-username
# SMTP_PASS=your-ses-smtp-password
# SMTP_FROM="Voice Agent <noreply@yourdomain.com>"

# Environment
NODE_ENV=production
```

**Important**: 
- Change `JWT_SECRET` to a secure random string
- Configure real SMTP credentials for email delivery
- Never commit `.env.local` to version control

### 2.2 Generate JWT Secret

```bash
# Generate a secure JWT secret
openssl rand -hex 32

# Copy the output and paste it as JWT_SECRET in .env.local
```

## 📧 Step 3: Configure Email Service

### Option A: Gmail (For Testing/Small Scale)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create password for "Mail" application
3. Use the generated password as `SMTP_PASS`

### Option B: SendGrid (Recommended for Production)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Use credentials:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Option C: AWS SES (For AWS Users)

1. Verify your domain in AWS SES
2. Create SMTP credentials
3. Use the provided SMTP settings

## 🚢 Step 4: Deploy Application

### 4.1 Using Deployment Script

The easiest way to deploy:

```bash
# On your local machine
cd voice-chat-app

# Update server details in deploy-with-auth.sh
nano deploy-with-auth.sh
# Set SERVER_HOST to your server IP or domain

# Make executable
chmod +x deploy-with-auth.sh

# Run deployment
./deploy-with-auth.sh
```

### 4.2 Manual Deployment

If you prefer manual deployment:

```bash
# On your local machine
git add .
git commit -m "Add authentication features"
git push origin main

# SSH into server
ssh ubuntu@your-server-ip

# Navigate to app directory
cd /var/www/voice-chat-app

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2
pm2 restart voice-chat-app --update-env

# Or start if first time
pm2 start npm --name "voice-chat-app" -- start

# Save PM2 configuration
pm2 save
```

## 🔍 Step 5: Verify Deployment

### 5.1 Check Application Status

```bash
# View PM2 status
pm2 list

# View logs
pm2 logs voice-chat-app

# Monitor in real-time
pm2 monit
```

### 5.2 Check Database Connection

```bash
# Connect to database
sudo -u postgres psql -d voice-agent-db

# Check tables
\dt

# Check users table
SELECT * FROM users;

# Check OTP codes table
SELECT * FROM otp_codes;

# Exit
\q
```

### 5.3 Test Authentication Flow

1. Open your application: `https://voice.teleai.tech`
2. Enter your email address
3. Check email for OTP code (or check server logs in development)
4. Enter OTP to authenticate
5. Verify voice chat works
6. Check timer countdown
7. Test session termination on tab close

### 5.4 Check Server Logs

```bash
# View application logs
pm2 logs voice-chat-app --lines 100

# View system logs
sudo journalctl -u postgresql -n 50

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Step 6: Nginx Configuration

Update your nginx configuration to handle the new authentication endpoints:

```bash
sudo nano /etc/nginx/sites-available/voice.teleai.tech
```

Ensure your configuration includes:

```nginx
server {
    listen 443 ssl http2;
    server_name voice.teleai.tech;

    ssl_certificate /etc/letsencrypt/live/voice.teleai.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voice.teleai.tech/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for WebSocket connections
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Test and reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🛡️ Step 7: Security Hardening

### 7.1 Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow PostgreSQL (only if remote access needed)
# sudo ufw allow 5432

# Check status
sudo ufw status
```

### 7.2 PostgreSQL Security

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Ensure PostgreSQL only listens locally
# listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 7.3 Secure File Permissions

```bash
# Protect .env.local
chmod 600 /var/www/voice-chat-app/.env.local

# Ensure proper ownership
sudo chown -R ubuntu:ubuntu /var/www/voice-chat-app
```

## 📊 Step 8: Monitoring and Maintenance

### 8.1 Set Up PM2 Monitoring

```bash
# Enable PM2 monitoring dashboard
pm2 web

# Or use PM2 Plus (cloud monitoring)
pm2 link your-secret-key your-public-key
```

### 8.2 Database Cleanup Cron Job

Create a cron job to clean up expired OTPs:

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup every hour
0 * * * * cd /var/www/voice-chat-app && /usr/bin/node -e "require('./lib/auth/otpService').cleanupExpiredOTPs()"
```

### 8.3 Backup Database

```bash
# Create backup script
nano /home/ubuntu/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/db-backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump voice-agent-db > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make executable and add to cron:

```bash
chmod +x /home/ubuntu/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

## 🐛 Troubleshooting

### Issue: Database Connection Failed

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l | grep voice-agent-db

# Check logs
sudo journalctl -u postgresql -n 50
```

### Issue: Email Not Sending

**Solution**:
```bash
# Check SMTP credentials in .env.local
cat /var/www/voice-chat-app/.env.local | grep SMTP

# Check application logs for email errors
pm2 logs voice-chat-app | grep -i email

# In development, OTP will be displayed in console
```

### Issue: JWT Token Errors

**Solution**:
```bash
# Verify JWT_SECRET is set
cat /var/www/voice-chat-app/.env.local | grep JWT_SECRET

# Clear browser localStorage and retry
# In browser console: localStorage.clear()
```

### Issue: PM2 Process Crashes

**Solution**:
```bash
# Check error logs
pm2 logs voice-chat-app --err --lines 100

# Restart with fresh environment
pm2 delete voice-chat-app
pm2 start npm --name "voice-chat-app" -- start
pm2 save

# Check memory usage
pm2 monit
```

### Issue: Build Fails on Server

**Solution**:
```bash
# Clear node_modules and rebuild
cd /var/www/voice-chat-app
rm -rf node_modules package-lock.json
npm install
npm run build

# Check Node.js version
node --version  # Should be 18+
```

## 📈 Performance Optimization

### Enable PM2 Cluster Mode

For better performance with multiple CPU cores:

```bash
pm2 delete voice-chat-app
pm2 start npm --name "voice-chat-app" -i max -- start
pm2 save
```

### Database Indexing

Ensure indexes are created (done automatically, but verify):

```sql
-- Connect to database
sudo -u postgres psql -d voice-agent-db

-- Check indexes
\di

-- Should see:
-- idx_otp_email
-- idx_otp_expires
```

## 🔄 Updating the Application

When you need to update:

```bash
# Method 1: Use deployment script
./deploy-with-auth.sh

# Method 2: Manual update
ssh ubuntu@your-server
cd /var/www/voice-chat-app
git pull origin main
npm install
npm run build
pm2 restart voice-chat-app --update-env
```

## 📞 Support Commands

Quick reference for common operations:

```bash
# View app status
pm2 status

# View logs
pm2 logs voice-chat-app

# Restart app
pm2 restart voice-chat-app

# Stop app
pm2 stop voice-chat-app

# Database connection
sudo -u postgres psql -d voice-agent-db

# Check users
sudo -u postgres psql -d voice-agent-db -c "SELECT email, remaining_seconds FROM users;"

# Check active OTPs
sudo -u postgres psql -d voice-agent-db -c "SELECT email, otp_code, expires_at FROM otp_codes WHERE verified = false;"

# Nginx reload
sudo nginx -t && sudo systemctl reload nginx

# Check disk space
df -h

# Check memory usage
free -h
```

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Application is accessible via HTTPS
- [ ] Authentication modal appears
- [ ] OTP emails are being delivered
- [ ] OTP verification works
- [ ] Voice chat connects successfully
- [ ] Timer countdown is visible and accurate
- [ ] Session ends when tab closes
- [ ] Database is tracking usage correctly
- [ ] PM2 is running and stable
- [ ] SSL certificate is valid
- [ ] Logs show no errors
- [ ] Backups are configured

## 🎉 Success!

Your Voice Chat application with authentication is now deployed!

- **URL**: https://voice.teleai.tech
- **Database**: voice-agent-db on PostgreSQL
- **Process Manager**: PM2
- **Features**: Email OTP auth, 3-minute usage limit, session tracking

For security review and further optimizations, review the AUTH_SETUP.md file.

---

**Last Updated**: 2024
**Version**: 1.0.0 with Authentication
#!/bin/bash

# Voice Chat App Deployment Script with Authentication
# This script handles deployment to the production server with database setup

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST="your-server-ip-or-domain"
APP_DIR="/var/www/voice-chat-app"
PM2_APP_NAME="voice-chat-app"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_error ".env.local file not found!"
    print_warning "Please create .env.local with required environment variables"
    exit 1
fi

print_status "Environment file found"

# Build the application locally
echo ""
echo "📦 Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Commit and push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy: $(date +%Y-%m-%d-%H-%M-%S)" || print_warning "No changes to commit"
git push origin main

print_status "Code pushed to GitHub"

# SSH into server and deploy
echo ""
echo "🔄 Deploying to server..."

ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

APP_DIR="/var/www/voice-chat-app"

echo "📍 Navigating to application directory..."
cd $APP_DIR

# Check if PostgreSQL is running
echo ""
echo "🔍 Checking PostgreSQL status..."
if sudo systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL is not running!"
    print_warning "Starting PostgreSQL..."
    sudo systemctl start postgresql
    if [ $? -eq 0 ]; then
        print_status "PostgreSQL started successfully"
    else
        print_error "Failed to start PostgreSQL"
        exit 1
    fi
fi

# Check if database exists
echo ""
echo "🗄️  Checking database..."
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='voice-agent-db'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
    print_status "Database 'voice-agent-db' exists"
else
    print_warning "Database 'voice-agent-db' does not exist - it will be created automatically by the app"
fi

# Pull latest code from GitHub
echo ""
echo "⬇️  Pulling latest code..."
git pull origin main

if [ $? -eq 0 ]; then
    print_status "Code updated successfully"
else
    print_error "Failed to pull code"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_status "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Build application
echo ""
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check if .env.local exists on server
if [ ! -f .env.local ]; then
    print_error ".env.local not found on server!"
    print_warning "Please create .env.local on the server with production settings"
    print_warning "Required variables:"
    echo "  - OPENAI_API_KEY"
    echo "  - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - SMTP settings (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)"
    exit 1
fi

print_status "Environment variables configured"

# Restart PM2 process
echo ""
echo "🔄 Restarting PM2 process..."

if pm2 list | grep -q "voice-chat-app"; then
    print_status "Restarting existing PM2 process..."
    pm2 restart voice-chat-app --update-env
else
    print_status "Starting new PM2 process..."
    pm2 start npm --name "voice-chat-app" -- start
fi

if [ $? -eq 0 ]; then
    print_status "PM2 process updated successfully"
else
    print_error "Failed to restart PM2 process"
    exit 1
fi

# Save PM2 configuration
pm2 save

echo ""
echo "📊 Application Status:"
pm2 list

echo ""
echo "📝 Recent logs:"
pm2 logs voice-chat-app --lines 20 --nostream

echo ""
print_status "Deployment completed successfully! 🎉"

echo ""
echo "ℹ️  Useful commands:"
echo "   View logs: pm2 logs voice-chat-app"
echo "   Stop app: pm2 stop voice-chat-app"
echo "   Restart: pm2 restart voice-chat-app"
echo "   Monitor: pm2 monit"
echo ""
echo "🗄️  Database commands:"
echo "   Connect: sudo -u postgres psql -d voice-agent-db"
echo "   Check users: SELECT * FROM users;"
echo "   Check OTPs: SELECT * FROM otp_codes;"
echo ""

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    print_status "🎉 Deployment successful!"
    echo ""
    echo "📱 Application should be available at: https://voice.teleai.tech"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Test authentication flow"
    echo "   2. Verify email delivery"
    echo "   3. Check database connectivity"
    echo "   4. Monitor logs for any errors"
    echo ""
else
    print_error "Deployment failed"
    exit 1
fi

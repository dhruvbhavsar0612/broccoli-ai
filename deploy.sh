#!/bin/bash

# Voice Chat App Deployment Script
# This script automates the deployment process on the EC2 server

set -e  # Exit on any error

echo "=========================================="
echo "Voice Chat App - Deployment Script"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}→ $1${NC}"
}

# Check if running on server
if [ ! -f "/etc/lsb-release" ]; then
    print_error "This script should be run on Ubuntu server"
    exit 1
fi

# Check if script is run as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

echo "Step 1: Update system packages"
print_info "Updating package lists..."
sudo apt update
print_success "System packages updated"
echo ""

echo "Step 2: Install Node.js (v20.x LTS)"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js is already installed: $NODE_VERSION"
    read -p "Do you want to reinstall? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
print_success "Node.js installed: $(node --version)"
print_success "npm installed: $(npm --version)"
echo ""

echo "Step 3: Install PM2"
if command -v pm2 &> /dev/null; then
    print_warning "PM2 is already installed"
else
    print_info "Installing PM2 globally..."
    sudo npm install -g pm2
fi
print_success "PM2 installed: $(pm2 --version)"
echo ""

echo "Step 4: Install Nginx"
if command -v nginx &> /dev/null; then
    print_warning "Nginx is already installed"
else
    print_info "Installing Nginx..."
    sudo apt install -y nginx
fi
print_success "Nginx installed"
echo ""

echo "Step 5: Install Git"
if command -v git &> /dev/null; then
    print_warning "Git is already installed"
else
    print_info "Installing Git..."
    sudo apt install -y git
fi
print_success "Git installed: $(git --version)"
echo ""

echo "Step 6: Setup application directory"
APP_DIR="/var/www/voice-chat-app"
if [ -d "$APP_DIR" ]; then
    print_warning "Application directory already exists"
    read -p "Do you want to remove and re-clone? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing existing directory..."
        sudo rm -rf "$APP_DIR"
        print_info "Creating application directory..."
        sudo mkdir -p "$APP_DIR"
        sudo chown -R $USER:$USER "$APP_DIR"

        print_info "Cloning repository..."
        cd /var/www
        git clone https://github.com/dhruvbhavsar0612/broccoli-ai.git voice-chat-app
    else
        cd "$APP_DIR"
        print_info "Pulling latest changes..."
        git pull origin main || print_warning "Could not pull latest changes"
    fi
else
    print_info "Creating application directory..."
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"

    print_info "Cloning repository..."
    cd /var/www
    git clone https://github.com/dhruvbhavsar0612/broccoli-ai.git voice-chat-app
fi
cd "$APP_DIR"
print_success "Application directory ready"
echo ""

echo "Step 7: Install dependencies"
print_info "Installing npm packages..."
npm ci
print_success "Dependencies installed"
echo ""

echo "Step 8: Configure environment variables"
if [ -f ".env.local" ]; then
    print_warning ".env.local already exists"
    read -p "Do you want to edit it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env.local
    fi
else
    print_info "Creating .env.local file..."
    cat > .env.local << 'EOF'
# OpenAI API Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Model Configuration
NEXT_PUBLIC_MODEL_NAME=gpt-4o-realtime-preview-2024-12-17
NEXT_PUBLIC_VOICE=sage
NEXT_PUBLIC_TEMPERATURE=0.8
NEXT_PUBLIC_MAX_TOKENS=4096

# Application Configuration
NODE_ENV=production
PORT=3000
EOF
    print_success ".env.local created"
    print_warning "Please edit .env.local to add your API keys"
    read -p "Press enter to edit now..." -r
    nano .env.local
fi
echo ""

echo "Step 9: Build application"
print_info "Building production bundle..."
npm run build
print_success "Application built successfully"
echo ""

echo "Step 10: Setup PM2"
print_info "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Stop existing PM2 process if running
pm2 stop voice-chat-app 2>/dev/null || true
pm2 delete voice-chat-app 2>/dev/null || true

print_info "Starting application with PM2..."
pm2 start ecosystem.config.js
print_success "Application started with PM2"

print_info "Configuring PM2 to start on boot..."
pm2 startup systemd -u $USER --hp /home/$USER | tail -n 1 | sudo bash
pm2 save
print_success "PM2 configured for auto-start"
echo ""

echo "Step 11: Configure Nginx"
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name is required"
    exit 1
fi

print_info "Creating Nginx configuration for $DOMAIN_NAME..."
sudo tee /etc/nginx/sites-available/voice-chat-app > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Logging
    access_log /var/log/nginx/voice-chat-app-access.log;
    error_log /var/log/nginx/voice-chat-app-error.log;

    # Root location
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # WebSocket support
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    client_max_body_size 10M;
}
EOF

print_info "Enabling site..."
sudo ln -sf /etc/nginx/sites-available/voice-chat-app /etc/nginx/sites-enabled/

print_info "Removing default site..."
sudo rm -f /etc/nginx/sites-enabled/default

print_info "Testing Nginx configuration..."
sudo nginx -t

print_info "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

print_success "Nginx configured successfully"
echo ""

echo "Step 12: Setup Firewall (UFW)"
print_info "Configuring firewall rules..."
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
print_success "Firewall configured"
echo ""

echo "Step 13: Install Certbot for SSL"
read -p "Do you want to install SSL certificate now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx

    print_warning "Make sure your DNS records are pointing to this server's IP!"
    print_info "Server IP: $(curl -s ifconfig.me)"
    read -p "Press enter to continue with SSL setup..." -r

    print_info "Obtaining SSL certificate..."
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME

    print_success "SSL certificate installed"
else
    print_warning "Skipping SSL setup. You can run this later:"
    print_warning "sudo apt install -y certbot python3-certbot-nginx"
    print_warning "sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
fi
echo ""

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
print_success "Your application should now be running at:"
print_info "HTTP:  http://$DOMAIN_NAME"
print_info "HTTPS: https://$DOMAIN_NAME (if SSL was configured)"
echo ""
print_info "Useful commands:"
echo "  pm2 status                  - Check application status"
echo "  pm2 logs voice-chat-app     - View application logs"
echo "  pm2 restart voice-chat-app  - Restart application"
echo "  pm2 monit                   - Monitor application"
echo "  sudo systemctl status nginx - Check Nginx status"
echo "  sudo nginx -t               - Test Nginx configuration"
echo ""
print_warning "Don't forget to configure your DNS records:"
print_info "A Record:    @ → $(curl -s ifconfig.me)"
print_info "A Record:  www → $(curl -s ifconfig.me)"
echo ""
print_info "For updates, run:"
echo "  cd /var/www/voice-chat-app"
echo "  git pull origin main"
echo "  npm ci"
echo "  npm run build"
echo "  pm2 restart voice-chat-app"
echo ""
print_success "Happy deploying! 🚀"

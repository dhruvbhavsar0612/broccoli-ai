# Deployment Guide

This guide provides step-by-step instructions for deploying the Voice Chat Application to an AWS EC2 instance using PM2 and Nginx.

## Prerequisites

- AWS EC2 instance (Ubuntu)
- Domain name pointing to your EC2 instance
- SSH access to your server
- GitHub account

## Table of Contents

1. [Push to GitHub](#1-push-to-github)
2. [Server Setup](#2-server-setup)
3. [Install Dependencies](#3-install-dependencies)
4. [Clone and Configure Application](#4-clone-and-configure-application)
5. [Build Application](#5-build-application)
6. [Setup PM2](#6-setup-pm2)
7. [Configure Nginx](#7-configure-nginx)
8. [Setup SSL with Let's Encrypt](#8-setup-ssl-with-lets-encrypt)
9. [DNS Configuration](#9-dns-configuration)
10. [Monitoring and Maintenance](#10-monitoring-and-maintenance)

---

## 1. Push to GitHub

### Initialize Git Repository (if not already done)

```bash
cd voice-chat-app
git init
git add .
git commit -m "Initial commit: Realtime Voice Chat Application"
```

### Add Remote and Push

```bash
git remote add origin https://github.com/dhruvbhavsar0612/broccoli-ai.git
git branch -M main
git push -u origin main
```

When prompted for credentials, use:
- Username: `dhruvbhavsar0612`
- Password: Your GitHub Personal Access Token

---

## 2. Server Setup

### Connect to EC2 Instance

```bash
ssh -i teleai-ssh.pem ubuntu@ec2-13-204-192-32.ap-south-1.compute.amazonaws.com
```

### Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Set Hostname (Optional but Recommended)

```bash
sudo hostnamectl set-hostname voice-chat-app
```

---

## 3. Install Dependencies

### Install Node.js (v20.x LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Install PM2 Globally

```bash
sudo npm install -g pm2
```

### Install Nginx

```bash
sudo apt install -y nginx
```

### Install Git (if not already installed)

```bash
sudo apt install -y git
```

---

## 4. Clone and Configure Application

### Create Application Directory

```bash
sudo mkdir -p /var/www/voice-chat-app
sudo chown -R $USER:$USER /var/www/voice-chat-app
```

### Clone Repository

```bash
cd /var/www
git clone https://github.com/dhruvbhavsar0612/broccoli-ai.git voice-chat-app
cd voice-chat-app
```

### Install Node Modules

```bash
npm ci --production=false
```

### Configure Environment Variables

Create the `.env.local` file:

```bash
nano .env.local
```

Add the following content (replace with your actual values):

```env
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
```

Save and exit (Ctrl+X, then Y, then Enter).

**Important Security Note:** For production, consider implementing a server-side proxy to keep your API key secure. See `ARCHITECTURE.md` for details.

---

## 5. Build Application

### Run Production Build

```bash
npm run build
```

This will create an optimized production build in the `.next` directory.

### Test the Build Locally (Optional)

```bash
npm start
```

Press Ctrl+C to stop once you verify it works.

---

## 6. Setup PM2

### Update PM2 Configuration

Edit the `ecosystem.config.js` file to ensure the path is correct:

```bash
nano ecosystem.config.js
```

Verify the `cwd` path is `/var/www/voice-chat-app`.

### Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

### Configure PM2 to Start on Boot

```bash
pm2 startup systemd
```

Copy and run the command that PM2 outputs, then:

```bash
pm2 save
```

### Useful PM2 Commands

```bash
pm2 status                    # Check application status
pm2 logs voice-chat-app       # View logs
pm2 restart voice-chat-app    # Restart application
pm2 stop voice-chat-app       # Stop application
pm2 delete voice-chat-app     # Remove from PM2
pm2 monit                     # Monitor in real-time
```

---

## 7. Configure Nginx

### Create Nginx Configuration

First, determine your domain name. For this guide, replace `your-domain.com` with your actual domain.

```bash
sudo nano /etc/nginx/sites-available/voice-chat-app
```

Copy the content from `nginx.conf` in the project root, replacing `your-domain.com` with your actual domain.

### Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/voice-chat-app /etc/nginx/sites-enabled/
```

### Remove Default Site (Optional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Test Nginx Configuration

```bash
sudo nginx -t
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### Enable Nginx to Start on Boot

```bash
sudo systemctl enable nginx
```

---

## 8. Setup SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtain SSL Certificate

**Before running this command**, ensure your domain's DNS records are pointing to your EC2 instance's public IP.

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

### Auto-Renewal Setup

Certbot automatically sets up a cron job for renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## 9. DNS Configuration

Configure the following DNS records with your domain registrar:

### Required DNS Records

| Type  | Name | Value                                      | TTL  |
|-------|------|--------------------------------------------|------|
| A     | @    | 13.204.192.32                              | 300  |
| A     | www  | 13.204.192.32                              | 300  |
| AAAA  | @    | [Your EC2 IPv6 if available]               | 300  |
| AAAA  | www  | [Your EC2 IPv6 if available]               | 300  |

### Notes:
- `@` represents the root domain (e.g., `example.com`)
- `www` is for the www subdomain (e.g., `www.example.com`)
- TTL of 300 seconds (5 minutes) allows for faster DNS propagation
- Replace `13.204.192.32` with your EC2 instance's public IP
- IPv6 (AAAA records) are optional but recommended if your EC2 instance supports it

### Verify DNS Propagation

After configuring DNS records, verify propagation:

```bash
# Check from your local machine
nslookup your-domain.com
dig your-domain.com

# Or use online tools
# https://www.whatsmydns.net/
```

DNS propagation can take anywhere from a few minutes to 48 hours, though it's usually quick (5-30 minutes).

---

## 10. Monitoring and Maintenance

### Create Log Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### View Application Logs

```bash
# PM2 logs
pm2 logs voice-chat-app

# Nginx access logs
sudo tail -f /var/log/nginx/voice-chat-app-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/voice-chat-app-error.log
```

### Monitor System Resources

```bash
# Real-time monitoring
htop

# Disk usage
df -h

# Memory usage
free -h

# PM2 monitoring
pm2 monit
```

### Updating the Application

When you push changes to GitHub:

```bash
cd /var/www/voice-chat-app
git pull origin main
npm ci
npm run build
pm2 restart voice-chat-app
```

### Backup Strategy

Regular backups recommended:

```bash
# Backup application
sudo tar -czf /home/ubuntu/backups/voice-chat-app-$(date +%Y%m%d).tar.gz /var/www/voice-chat-app

# Backup environment variables
sudo cp /var/www/voice-chat-app/.env.local /home/ubuntu/backups/.env.local.backup
```

### Security Best Practices

1. **Firewall Configuration:**
   ```bash
   sudo ufw allow 22/tcp      # SSH
   sudo ufw allow 80/tcp      # HTTP
   sudo ufw allow 443/tcp     # HTTPS
   sudo ufw enable
   ```

2. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Monitor Failed Login Attempts:**
   ```bash
   sudo grep "Failed password" /var/log/auth.log
   ```

4. **Keep Dependencies Updated:**
   ```bash
   npm audit
   npm audit fix
   ```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs voice-chat-app --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart voice-chat-app
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Out of Memory

```bash
# Check memory
free -h

# Consider adding swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### WebSocket Connection Issues

Ensure your Nginx configuration has WebSocket support enabled (already included in the provided `nginx.conf`).

Check security group rules in AWS EC2 console to ensure ports 80 and 443 are open.

---

## Quick Deployment Checklist

- [ ] Push code to GitHub
- [ ] Connect to EC2 instance
- [ ] Install Node.js, PM2, Nginx, Git
- [ ] Clone repository to `/var/www/voice-chat-app`
- [ ] Install dependencies: `npm ci`
- [ ] Create `.env.local` with API keys
- [ ] Build application: `npm run build`
- [ ] Start with PM2: `pm2 start ecosystem.config.js`
- [ ] Configure PM2 startup: `pm2 startup && pm2 save`
- [ ] Configure Nginx with your domain
- [ ] Test Nginx: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`
- [ ] Configure DNS A records
- [ ] Setup SSL: `sudo certbot --nginx -d your-domain.com`
- [ ] Test application in browser
- [ ] Monitor logs: `pm2 logs voice-chat-app`

---

## Support

For issues or questions:
- Check the logs: `pm2 logs voice-chat-app`
- Review `ARCHITECTURE.md` for technical details
- Review `QUICKSTART.md` for local development setup

---

## License

See LICENSE file for details.
# Quick Deployment Guide

**Deploy your Voice Chat App to EC2 in under 30 minutes!**

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ EC2 instance running Ubuntu (already set up)
- ✅ Domain name ready
- ✅ OpenAI API key
- ✅ SSH key file (`teleai-ssh.pem`)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Push to GitHub (Local Machine)

```bash
cd voice-chat-app
chmod +x push-to-github.sh
./push-to-github.sh
```

**Windows users:** Use Git Bash or WSL, or run commands manually:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/dhruvbhavsar0612/broccoli-ai.git
git push -u origin main
```

When prompted for password, use your GitHub Personal Access Token.

---

### Step 2: Deploy to Server

**Connect to EC2:**

```bash
ssh -i server_info/teleai-ssh.pem ubuntu@ec2-13-204-192-32.ap-south-1.compute.amazonaws.com
```

**Run deployment script:**

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/dhruvbhavsar0612/broccoli-ai/main/deploy.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**Or clone and deploy manually:**

```bash
# Install prerequisites
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2

# Clone repository
sudo mkdir -p /var/www/voice-chat-app
sudo chown -R $USER:$USER /var/www/voice-chat-app
git clone https://github.com/dhruvbhavsar0612/broccoli-ai.git /var/www/voice-chat-app
cd /var/www/voice-chat-app

# Setup environment
npm ci
nano .env.local  # Add your OpenAI API key

# Build and start
npm run build
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configure Nginx (replace YOUR-DOMAIN.com)
sudo nano /etc/nginx/sites-available/voice-chat-app
sudo ln -s /etc/nginx/sites-available/voice-chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR-DOMAIN.com -d www.YOUR-DOMAIN.com
```

---

### Step 3: Configure DNS

Add these records to your DNS provider:

| Type | Name | Value          | TTL |
|------|------|----------------|-----|
| A    | @    | 13.204.192.32  | 300 |
| A    | www  | 13.204.192.32  | 300 |

**Popular DNS Providers:**
- Cloudflare: DNS → Add Record
- Namecheap: Advanced DNS
- GoDaddy: DNS Management
- Route 53: Hosted Zones

---

## ⚙️ Environment Variables

Edit `/var/www/voice-chat-app/.env.local` on your server:

```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_MODEL_NAME=gpt-4o-realtime-preview-2024-12-17
NEXT_PUBLIC_VOICE=sage
NEXT_PUBLIC_TEMPERATURE=0.8
NEXT_PUBLIC_MAX_TOKENS=4096
NODE_ENV=production
PORT=3000
```

---

## 🔍 Verify Deployment

### Check Application Status

```bash
pm2 status
pm2 logs voice-chat-app
```

### Check Nginx

```bash
sudo systemctl status nginx
sudo nginx -t
```

### Test Website

```bash
# From server
curl http://localhost:3000

# From local machine (after DNS propagates)
curl http://your-domain.com
```

---

## 📊 Monitoring Commands

```bash
# PM2
pm2 status                    # Application status
pm2 logs voice-chat-app       # View logs
pm2 monit                     # Real-time monitoring
pm2 restart voice-chat-app    # Restart app

# System
htop                          # System resources
df -h                         # Disk usage
free -h                       # Memory usage

# Nginx
sudo tail -f /var/log/nginx/voice-chat-app-access.log
sudo tail -f /var/log/nginx/voice-chat-app-error.log
```

---

## 🔄 Update Application

When you push changes to GitHub:

```bash
cd /var/www/voice-chat-app
git pull origin main
npm ci
npm run build
pm2 restart voice-chat-app
```

---

## 🔒 Security Checklist

- [x] Firewall configured (UFW)
- [x] SSL certificate installed
- [x] API keys in environment variables (not code)
- [ ] Regular system updates: `sudo apt update && sudo apt upgrade -y`
- [ ] Monitor logs for suspicious activity
- [ ] Consider fail2ban for SSH protection

---

## 🆘 Troubleshooting

### Application won't start

```bash
pm2 logs voice-chat-app --lines 50
pm2 restart voice-chat-app
```

### Port 3000 already in use

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart voice-chat-app
```

### Nginx configuration error

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### SSL certificate issues

```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### DNS not resolving

```bash
nslookup your-domain.com
dig your-domain.com +short
```

Wait up to 48 hours for full propagation (usually 5-30 minutes).

---

## 📚 Additional Documentation

- **DEPLOYMENT.md** - Comprehensive deployment guide
- **DNS-SETUP.md** - Detailed DNS configuration
- **ARCHITECTURE.md** - Application architecture
- **QUICKSTART.md** - Local development setup
- **README.md** - Project overview

---

## 🔗 Important Links

- **GitHub Repository:** https://github.com/dhruvbhavsar0612/broccoli-ai
- **EC2 Instance:** ec2-13-204-192-32.ap-south-1.compute.amazonaws.com
- **Server IP:** 13.204.192.32

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

- [ ] Code pushed to GitHub
- [ ] Connected to EC2 instance
- [ ] Node.js installed (v20.x)
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Repository cloned to `/var/www/voice-chat-app`
- [ ] Dependencies installed (`npm ci`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Application built (`npm run build`)
- [ ] PM2 started and saved
- [ ] Nginx configured with domain
- [ ] Nginx tested and restarted
- [ ] Firewall rules configured
- [ ] DNS A records created
- [ ] DNS propagation verified
- [ ] SSL certificate installed
- [ ] HTTPS working
- [ ] Application accessible via domain
- [ ] Monitoring set up

---

## 🎉 Success!

Once all steps are complete, your Voice Chat App will be live at:

- **HTTP:** http://your-domain.com
- **HTTPS:** https://your-domain.com

The application features:
- ✨ Real-time voice chat with OpenAI
- 🎨 3D cosmic visualizer
- 🎙️ Voice activity detection
- 💬 Streaming AI responses
- 🔒 Secure HTTPS connection

---

## 📞 Support

For issues:
1. Check the logs: `pm2 logs voice-chat-app`
2. Review troubleshooting section above
3. Consult detailed guides in `DEPLOYMENT.md` and `DNS-SETUP.md`

---

**Deployment Time:** ~20-30 minutes (excluding DNS propagation)

**Last Updated:** 2024

**Happy Deploying! 🚀**
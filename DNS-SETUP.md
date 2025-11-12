# DNS Configuration Guide

This document provides the DNS records you need to configure for deploying the Voice Chat Application.

## Server Information

- **EC2 Public IP:** `13.204.192.32`
- **Region:** `ap-south-1` (Mumbai)
- **Instance:** `ec2-13-204-192-32.ap-south-1.compute.amazonaws.com`

---

## DNS Records to Create

Configure the following records in your DNS provider's control panel:

### Required A Records

| Record Type | Host/Name | Value/Points to | TTL  | Priority |
|-------------|-----------|-----------------|------|----------|
| A           | @         | 13.204.192.32   | 300  | -        |
| A           | www       | 13.204.192.32   | 300  | -        |

### Optional Records

| Record Type | Host/Name | Value/Points to                           | TTL  | Priority |
|-------------|-----------|-------------------------------------------|------|----------|
| CNAME       | *         | your-domain.com                           | 300  | -        |

---

## Record Explanations

### A Record - Root Domain (@)
- **Purpose:** Points your root domain (e.g., `example.com`) to your server
- **Host:** `@` or leave blank (represents root domain)
- **Value:** `13.204.192.32`
- **TTL:** `300` (5 minutes - allows quick updates during setup)

### A Record - WWW Subdomain
- **Purpose:** Points www subdomain (e.g., `www.example.com`) to your server
- **Host:** `www`
- **Value:** `13.204.192.32`
- **TTL:** `300`

### CNAME Record - Wildcard (Optional)
- **Purpose:** Catch-all for any subdomain
- **Host:** `*`
- **Value:** Your root domain
- **TTL:** `300`

---

## Configuration by Popular DNS Providers

### Cloudflare

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Go to **DNS** → **Records**
4. Click **Add record**
5. For root domain:
   - Type: `A`
   - Name: `@`
   - IPv4 address: `13.204.192.32`
   - Proxy status: DNS only (grey cloud) initially
   - TTL: `Auto`
6. For www subdomain:
   - Type: `A`
   - Name: `www`
   - IPv4 address: `13.204.192.32`
   - Proxy status: DNS only (grey cloud) initially
   - TTL: `Auto`
7. Click **Save**

**Note:** After SSL is configured, you can enable Cloudflare proxy (orange cloud) for additional security and CDN benefits.

### Namecheap

1. Log in to Namecheap
2. Go to **Domain List**
3. Click **Manage** next to your domain
4. Go to **Advanced DNS** tab
5. Click **Add New Record**
6. For root domain:
   - Type: `A Record`
   - Host: `@`
   - Value: `13.204.192.32`
   - TTL: `5 min` or `Automatic`
7. For www subdomain:
   - Type: `A Record`
   - Host: `www`
   - Value: `13.204.192.32`
   - TTL: `5 min` or `Automatic`
8. Click **Save all changes**

### GoDaddy

1. Log in to GoDaddy
2. Go to **My Products** → **DNS**
3. Click on your domain
4. Click **Add** under DNS Records
5. For root domain:
   - Type: `A`
   - Name: `@`
   - Value: `13.204.192.32`
   - TTL: `600 seconds` (or Custom)
6. For www subdomain:
   - Type: `A`
   - Name: `www`
   - Value: `13.204.192.32`
   - TTL: `600 seconds`
7. Click **Save**

### Google Domains / Google Cloud DNS

1. Log in to Google Domains
2. Click **DNS** in the left menu
3. Scroll to **Custom resource records**
4. For root domain:
   - Name: `@`
   - Type: `A`
   - TTL: `5m`
   - Data: `13.204.192.32`
5. For www subdomain:
   - Name: `www`
   - Type: `A`
   - TTL: `5m`
   - Data: `13.204.192.32`
6. Click **Add**

### Route 53 (AWS)

1. Log in to AWS Console
2. Go to **Route 53** → **Hosted Zones**
3. Select your domain
4. Click **Create Record**
5. For root domain:
   - Record name: (leave blank)
   - Record type: `A - IPv4 address`
   - Value: `13.204.192.32`
   - TTL: `300`
   - Routing policy: `Simple routing`
6. For www subdomain:
   - Record name: `www`
   - Record type: `A - IPv4 address`
   - Value: `13.204.192.32`
   - TTL: `300`
   - Routing policy: `Simple routing`
7. Click **Create records**

---

## Verification

### Check DNS Propagation

After creating the records, verify they're working:

#### Using Command Line

```bash
# Check A record for root domain
nslookup your-domain.com

# Check A record for www subdomain
nslookup www.your-domain.com

# Using dig (more detailed)
dig your-domain.com +short
dig www.your-domain.com +short

# Check from multiple locations
dig @8.8.8.8 your-domain.com +short    # Google DNS
dig @1.1.1.1 your-domain.com +short    # Cloudflare DNS
```

Expected output: `13.204.192.32`

#### Using Online Tools

- **WhatsMyDNS:** https://www.whatsmydns.net/
  - Enter your domain
  - Select "A" record type
  - Should show `13.204.192.32` globally

- **DNS Checker:** https://dnschecker.org/
  - Enter your domain
  - Check propagation worldwide

- **MXToolbox:** https://mxtoolbox.com/SuperTool.aspx
  - Enter your domain
  - Select "DNS Lookup"

### Test Website Access

Once DNS propagates:

```bash
# Test HTTP
curl -I http://your-domain.com

# Test with host header
curl -H "Host: your-domain.com" http://13.204.192.32
```

---

## Propagation Time

- **Minimum:** 5-10 minutes
- **Average:** 30 minutes to 2 hours
- **Maximum:** Up to 48 hours (rare)

**Tip:** Use a low TTL (300 seconds) during initial setup for faster updates.

---

## Troubleshooting

### DNS Not Resolving

1. **Check record syntax:**
   - No trailing dots in most providers (unless specified)
   - Use `@` for root domain, not blank space
   - Verify IP address is correct: `13.204.192.32`

2. **Clear DNS cache:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

3. **Check from authoritative nameservers:**
   ```bash
   dig your-domain.com NS +short  # Get nameservers
   dig @nameserver.com your-domain.com +short  # Query directly
   ```

### Website Not Loading

1. **Verify server is accessible:**
   ```bash
   ping 13.204.192.32
   telnet 13.204.192.32 80
   ```

2. **Check firewall rules on EC2:**
   - Security Group must allow inbound traffic on ports 80 and 443
   - UFW on server must allow ports 80 and 443

3. **Verify Nginx is running:**
   ```bash
   sudo systemctl status nginx
   ```

### SSL Issues

1. **DNS must be fully propagated** before running Certbot
2. **Security group** must allow port 80 for ACME challenge
3. Check Certbot logs: `/var/log/letsencrypt/letsencrypt.log`

---

## Post-Configuration Checklist

After DNS is configured and propagated:

- [ ] Root domain resolves to `13.204.192.32`
- [ ] WWW subdomain resolves to `13.204.192.32`
- [ ] Website loads via HTTP (port 80)
- [ ] Nginx reverse proxy is working
- [ ] Application is running via PM2
- [ ] SSL certificate installed (if completed)
- [ ] Website loads via HTTPS (port 443)
- [ ] HTTP redirects to HTTPS
- [ ] WWW redirects to non-WWW (or vice versa, as configured)

---

## Security Considerations

### After DNS is Working

1. **Enable HTTPS redirect** in Nginx (already in config)
2. **Consider Cloudflare proxy** for DDoS protection
3. **Set up fail2ban** to prevent brute force attacks
4. **Regular security updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### Recommended Security Headers

Already included in the Nginx configuration:
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`
- `Referrer-Policy`

---

## Support

For DNS-related issues:
- Check your DNS provider's documentation
- Use online DNS checking tools
- Verify records in DNS provider's control panel
- Wait for full propagation (up to 48 hours)

For server-related issues:
- Check `DEPLOYMENT.md` for troubleshooting steps
- Review server logs: `pm2 logs voice-chat-app`
- Check Nginx logs: `/var/log/nginx/voice-chat-app-error.log`

---

## Quick Reference Card

**Your Server IP:** `13.204.192.32`

**Required DNS Records:**
```
A     @     13.204.192.32
A     www   13.204.192.32
```

**Verify:**
```bash
nslookup your-domain.com
# Should return: 13.204.192.32
```

**Once DNS propagates, run SSL setup:**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

Last updated: 2024
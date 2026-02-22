# Kombass Production Deployment Guide

## Choose Your Deployment Method

### 🎯 If you have **EasyPanel** running on Hetzner:
→ **[DEPLOYMENT-EASYPANEL-SIMPLE.md](./DEPLOYMENT-EASYPANEL-SIMPLE.md)** ← Use this!

EasyPanel handles Docker, reverse proxy, SSL, and auto-deploy automatically.

### 🔧 If you have **raw Hetzner server** (no control panel):
→ Continue reading below for manual Docker + Nginx setup.

---

# Manual Deployment (For Raw Hetzner Servers)

---

## Phase 3: Nginx Configuration (One-time setup on Hetzner)

### SSH to your Hetzner CX23 and create the nginx site config:

```bash
# SSH into Hetzner
ssh root@<your-hetzner-ip>

# Create nginx config
cat > /etc/nginx/sites-available/kombass << 'EOF'
server {
    listen 80;
    server_name kombass.maximepico.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name kombass.maximepico.com;

    ssl_certificate /etc/letsencrypt/live/kombass.maximepico.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kombass.maximepico.com/privkey.pem;

    root /var/www/kombass;
    index index.html;

    # SPA routing — send all non-file requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.io WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/kombass /etc/nginx/sites-enabled/kombass

# Test nginx config
nginx -t

# Reload nginx
nginx -s reload
```

### Setup SSL with Certbot:

```bash
# Install certbot if needed
apt-get update && apt-get install -y certbot python3-certbot-nginx

# Generate SSL cert (interactive)
certbot --nginx -d kombass.maximepico.com

# Auto-renewal setup
certbot renew --dry-run
```

---

## Phase 5: First-Time Hetzner Setup

### 1. Clone the repository

```bash
ssh root@<your-hetzner-ip>
mkdir -p /opt/kombass /var/www/kombass
cd /opt/kombass
git clone https://github.com/<your-username>/kombass.git .
```

### 2. Create `.env` file for the backend (NOT in git)

```bash
cat > server/.env << 'EOF'
DATABASE_URL=postgresql://kombass:<strong-random-password>@db:5432/kombass
NODE_ENV=production
PORT=9000
FRONTEND_URL=https://kombass.maximepico.com
DB_PASSWORD=<strong-random-password>
EOF

chmod 600 server/.env
```

### 3. First Docker launch

```bash
cd /opt/kombass/server
docker compose up -d

# Verify containers are running
docker compose ps

# Check logs
docker compose logs -f
```

### 4. Verify the deployment

```bash
# Test backend API
curl http://localhost:9000/api/room

# Test frontend is served by nginx
curl https://kombass.maximepico.com

# Check nginx proxy works
curl https://kombass.maximepico.com/api/room
```

---

## GitHub Actions Setup

### Add these secrets to your GitHub repository:

Go to: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|---|---|
| `HETZNER_HOST` | Your Hetzner CX23 IP address |
| `HETZNER_USER` | SSH user (e.g., `root`) |
| `HETZNER_SSH_KEY` | Your private SSH key content |

### To generate/copy your SSH key:

```bash
# On your local machine, display your existing SSH key
cat ~/.ssh/id_rsa  # Copy the entire contents (including BEGIN/END lines)

# OR generate a new one for Hetzner
ssh-keygen -t rsa -b 4096 -f ~/.ssh/hetzner_rsa -N ""
cat ~/.ssh/hetzner_rsa  # Copy this to GitHub secret

# Add public key to Hetzner authorized_keys
ssh-copy-id -i ~/.ssh/hetzner_rsa.pub root@<your-hetzner-ip>
```

---

## Deployment Flow

1. **Push to `main` branch**
   ```bash
   git push origin main
   ```

2. **GitHub Actions runs:**
   - Frontend tests (45 tests must pass)
   - Backend TypeScript checks
   - If both pass: builds frontend + deploys to Hetzner

3. **On Hetzner:**
   - Frontend build synced to `/var/www/kombass/`
   - Backend repo pulled + Docker images rebuilt
   - New containers deployed with zero downtime

4. **Nginx** serves:
   - Static files from `/var/www/kombass/` (frontend React build)
   - `/api/*` proxied to backend on localhost:9000
   - `/socket.io/*` WebSocket proxied to backend

---

## Troubleshooting

### Docker containers won't start

```bash
cd /opt/kombass/server
docker compose logs -f

# Check if port 9000 is free
lsof -i :9000

# Restart containers
docker compose restart
```

### Database connection errors

```bash
# Check if DB container is healthy
docker compose ps

# View database logs
docker compose logs db

# Manually test DB connection
docker exec -it <db-container-id> psql -U kombass -d kombass
```

### Nginx not proxying

```bash
# Check nginx config
nginx -t

# View nginx error log
tail -f /var/log/nginx/error.log

# Verify backend is accessible
curl http://localhost:9000/api/room
```

### SSL certificate issues

```bash
# Check certificate validity
certbot certificates

# Renew manually
certbot renew --force-renewal

# Check nginx SSL config
openssl s_client -connect kombass.maximepico.com:443
```

---

## Ongoing Maintenance

### Update deployment

```bash
# Make code changes locally
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions automatically builds and deploys
```

### Update database schema

```bash
# On Hetzner after code changes
cd /opt/kombass
git pull origin main
cd server

# Migrations run automatically on container start
# But you can manually check migration status
docker compose exec backend npx prisma migrate status
```

### View production logs

```bash
# Backend logs
cd /opt/kombass/server && docker compose logs -f backend

# Database logs
docker compose logs -f db

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Backup database

```bash
cd /opt/kombass/server
docker compose exec db pg_dump -U kombass kombass > backup-$(date +%Y%m%d-%H%M%S).sql
```

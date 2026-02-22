# Kombass Deployment Guide — EasyPanel Edition

This guide covers deploying Kombass to Hetzner using **EasyPanel** (Docker-based hosting panel).

---

## Prerequisites

- ✅ EasyPanel admin access (login at your EasyPanel URL)
- ✅ Code ready for deployment (all GitHub Actions setup complete)
- ✅ Domain: `kombass.maximepico.com`

---

## Step 1: Check EasyPanel's Built-in Services

### Access EasyPanel Admin

1. **Login to EasyPanel** at your admin URL
2. **Navigate to Services or Docker Compose**
3. **Check what's already available:**
   - [ ] PostgreSQL 16 or similar database
   - [ ] Nginx or reverse proxy service
   - [ ] Docker Compose management UI

### Common EasyPanel Features

**Services Tab** — Shows running services (databases, app servers, etc.)
**Docker** — Direct Docker/Docker Compose management
**Reverse Proxy** — nginx/traefik configuration for domain routing
**Storage/Volumes** — Persistent storage for databases and files

---

## Step 2: Create PostgreSQL Database (if not exists)

### Option A: Use EasyPanel's Built-in DB

1. Go to **Services** → **Add Service**
2. Select **PostgreSQL** (or **Postgres**)
3. Configure:
   - **Name**: `kombass-db` (or similar)
   - **Password**: Set a strong password (save this!)
   - **Port**: Leave as default (usually 5432, but localhost-only)
4. Click **Create** and wait for it to start

**Note the connection details:**
```
Host: localhost or the service name (e.g., kombass-db)
Port: 5432
Username: postgres (default)
Password: <your-password>
Database: kombass (you may need to create this manually via psql)
```

### Option B: Use docker-compose.yml (Self-managed)

Skip this if using EasyPanel's built-in DB. Otherwise, you can define DB in your docker-compose.yml.

---

## Step 3: Deploy Backend via EasyPanel

### Create Docker Service

1. **In EasyPanel**, go to **Docker** or **Services** → **Add Service**
2. **Select Docker Compose** or **Docker Image**
3. **Option A: Upload docker-compose.yml**
   - In your local repo, customize:
     ```yaml
     services:
       backend:
         build:
           context: .
           dockerfile: server/Dockerfile
         restart: always
         environment:
           DATABASE_URL: postgresql://postgres:YOUR_DB_PASSWORD@kombass-db:5432/kombass
           NODE_ENV: production
           PORT: 9000
           FRONTEND_URL: https://kombass.maximepico.com
         depends_on:
           - db  # or remove if using EasyPanel's DB
         ports:
           - "9000:9000"  # expose for reverse proxy

       # ONLY if not using EasyPanel's DB:
       db:
         image: postgres:16-alpine
         restart: always
         environment:
           POSTGRES_DB: kombass
           POSTGRES_USER: postgres
           POSTGRES_PASSWORD: YOUR_DB_PASSWORD
         volumes:
           - postgres_data:/var/lib/postgresql/data

     volumes:
       postgres_data:
     ```
   - Upload via EasyPanel's file manager or Docker Compose UI
   - Click **Deploy**

4. **Option B: Add Service via EasyPanel UI**
   - **Service Name**: `kombass-backend`
   - **Image**: `node:20-alpine` or build from your Dockerfile
   - **Environment Variables**:
     - `DATABASE_URL=postgresql://postgres:PASSWORD@kombass-db:5432/kombass`
     - `NODE_ENV=production`
     - `PORT=9000`
     - `FRONTEND_URL=https://kombass.maximepico.com`
   - **Volume Mounts** (if needed):
     - Mount source code directory
     - Mount database volume

---

## Step 4: Deploy Frontend

### Option A: Build Locally, Upload to EasyPanel File Manager

```bash
# On your local machine, build production frontend
cd kombass
npm run build

# This creates kombass/build/ directory
# Then upload via EasyPanel's File Manager to:
# /var/www/kombass/ or similar web root
```

### Option B: Let GitHub Actions Deploy Frontend

If GitHub Actions has SSH access, it will auto-deploy via the workflow. Otherwise:

1. **Manually upload** `build/` folder via EasyPanel file manager
2. **Or use SCP** if you have SSH key access

---

## Step 5: Configure Reverse Proxy (Nginx/Traefik)

### In EasyPanel, create reverse proxy rules:

**For domain: `kombass.maximepico.com`**

#### Route 1: Static Files (Frontend)
```
Domain: kombass.maximepico.com
Path: /
Backend: localhost:3000 or /var/www/kombass (nginx static serve)
Type: HTTP/HTTPS
```

#### Route 2: API Proxy
```
Domain: kombass.maximepico.com
Path: /api/
Backend: localhost:9000
Type: HTTP (proxied from HTTPS)
Headers: Preserve X-Real-IP, X-Forwarded-For
```

#### Route 3: WebSocket Proxy (/socket.io)
```
Domain: kombass.maximepico.com
Path: /socket.io/
Backend: localhost:9000
Type: WebSocket
Headers: Upgrade, Connection headers preserved
```

### If EasyPanel uses Traefik:

Look for **Traefik Labels** or **Router Configuration** and add:

```yaml
traefik:
  enabled: true
  frontend.rule: "Host:kombass.maximepico.com"
  frontend.entryPoints: "https"
  backend.loadbalancer.server.port: 9000
```

### If EasyPanel uses Nginx:

Add server block to nginx config (usually via EasyPanel UI):

```nginx
server {
    listen 443 ssl;
    server_name kombass.maximepico.com;

    ssl_certificate /path/to/cert;
    ssl_certificate_key /path/to/key;

    root /var/www/kombass;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Step 6: SSL Certificate (HTTPS)

### EasyPanel Usually Provides:

1. **Let's Encrypt** integration (auto-renew)
2. **Certificate Management** UI
3. **Auto HTTPS redirect** (80 → 443)

**In EasyPanel:**
- Go to **Domains** or **SSL Certificates**
- Add `kombass.maximepico.com`
- Select **Let's Encrypt** (auto-provision)
- Confirm domain ownership (usually DNS-based)
- Certificate auto-renews

---

## Step 7: Deploy Frontend via GitHub Actions (Optional)

If you want GitHub Actions to auto-deploy frontend:

### Update `.github/workflows/ci-deploy.yml`

Replace the SCP step with EasyPanel API call or manual trigger:

```yaml
# Option: Trigger EasyPanel webhook (if available)
- name: Trigger Deployment
  run: |
    curl -X POST https://your-easypanel-url/api/deploy \
      -H "Authorization: Bearer YOUR_EASYPANEL_TOKEN" \
      -d '{"service": "kombass-frontend"}'
```

**Or:** Continue manual frontend uploads (simpler for now).

---

## Step 8: Verify Deployment

### Test Backend API

```bash
curl https://kombass.maximepico.com/api/room
# Should return: {"roomId": "xxxxx", "sessionToken": "xxxxx"}
```

### Test Frontend

```bash
curl https://kombass.maximepico.com
# Should return HTML (React index.html)
```

### Test WebSocket Proxy

```bash
# In browser console at https://kombass.maximepico.com
console.log(window.location.origin); // Should show domain
// Game should connect and work
```

---

## Step 9: View Logs

### In EasyPanel:

1. **Docker Logs**: Services → Select service → View Logs
2. **Nginx Logs**: Reverse Proxy settings → Logs (if available)
3. **Database Logs**: Services → PostgreSQL → Logs

### Command-line (if SSH ever available):

```bash
# View Docker container logs
docker logs <container-id>

# View Docker Compose logs
docker compose -f /path/to/docker-compose.yml logs -f
```

---

## Step 10: Database Backup

### In EasyPanel:

1. Go to **Services** → **PostgreSQL**
2. Look for **Backup** or **Export** option
3. Create snapshot/backup regularly

### Manual Backup (if SSH available later):

```bash
docker exec <postgres-container> pg_dump -U postgres kombass > backup.sql
```

---

## Updating the Deployment

### When you push code to main:

1. **GitHub Actions runs tests** (automatic)
2. **If tests pass**, GitHub Actions builds frontend
3. **Manually upload** new `build/` folder to EasyPanel file manager (or wait for SSH setup)
4. **Backend auto-updates** if docker-compose is set to auto-pull + rebuild on push

### To update manually:

1. **Pull latest code** on Hetzner (or via EasyPanel's git integration)
2. **Rebuild Docker image**: EasyPanel → Services → Rebuild
3. **Restart service**: EasyPanel → Services → Restart

---

## Troubleshooting

### Backend not responding

```
✓ Check Docker service is running (EasyPanel → Services)
✓ Check logs (EasyPanel → Logs)
✓ Verify DATABASE_URL is correct
✓ Verify PORT is exposed (9000)
✓ Check reverse proxy is forwarding to localhost:9000
```

### Database connection fails

```
✓ Check PostgreSQL is running (EasyPanel → Services)
✓ Verify DB name (kombass), user, password
✓ Check DATABASE_URL format: postgresql://user:pass@host:port/db
✓ View DB logs in EasyPanel
```

### Frontend not loading

```
✓ Check frontend files are in /var/www/kombass/
✓ Verify nginx is configured with SPA routing (try_files)
✓ Check HTTPS redirect is working (curl -I https://...)
✓ Verify reverse proxy rules in EasyPanel
```

### WebSocket errors

```
✓ Ensure /socket.io/ route preserves Upgrade headers
✓ Check proxy_http_version 1.1 in nginx config
✓ Verify FRONTEND_URL env var is set correctly
✓ Check backend logs for socket.io errors
```

---

## Quick Reference: EasyPanel Workflow

```
EasyPanel Admin
  ├─ Services (manage containers)
  ├─ Docker (view/edit docker-compose)
  ├─ Reverse Proxy (nginx/traefik rules)
  ├─ Domains (SSL certificates)
  ├─ File Manager (upload files)
  ├─ Logs (view container output)
  └─ Backups (database snapshots)
```

---

## Next: GitHub Actions + EasyPanel Integration

Once SSH works (or via EasyPanel API), GitHub Actions will auto-deploy:
- Frontend: `rsync build/ to /var/www/kombass/`
- Backend: `git pull + docker compose rebuild`

For now, use manual steps above. This can be automated later once you have stable EasyPanel setup.

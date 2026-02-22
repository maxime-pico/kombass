# Kombass on EasyPanel — Simple Deployment Guide

Deploy Kombass with a single docker-compose.yml file. EasyPanel handles the rest automatically.

---

## What You'll Do

1. **In EasyPanel:** Create new project with docker-compose.yml
2. **In GitHub:** Add API token for auto-deploy
3. **That's it** — EasyPanel builds, deploys, manages SSL, and auto-updates on every push

---

## Step 1: Create Project in EasyPanel

### 1.1 Login to EasyPanel admin

Navigate to your EasyPanel dashboard (URL provided in your email/setup).

### 1.2 Click "New Project" or "Create App"

You'll see options:
- Docker Image
- Docker Compose ← **Choose this**
- Git Repository ← Or this (EasyPanel auto-detects)

### 1.3 Select "Docker Compose"

You'll get a form where you can:
- Name: `kombass`
- Docker Compose YAML: paste the config below

---

## Step 2: Prepare docker-compose.yml for EasyPanel

EasyPanel will auto-generate:
- Domain routes
- SSL certificates (Let's Encrypt)
- Environment variables UI
- Reverse proxy

**Use this docker-compose.yml:**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: kombass
      POSTGRES_USER: kombass
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: server/Dockerfile
    restart: always
    environment:
      DATABASE_URL: postgresql://kombass:${DB_PASSWORD}@db:5432/kombass
      NODE_ENV: production
      PORT: 3000
      FRONTEND_URL: https://kombass.maximepico.com
    depends_on:
      - db
    expose:
      - "3000"

volumes:
  postgres_data:
```

**Key differences from standard deployment:**
- Backend PORT: `3000` (not 9000) — EasyPanel manages routing
- No port bindings to host (EasyPanel proxies internally)
- All env vars defined in `environment:` section

---

## Step 3: Configure Environment Variables in EasyPanel

When you paste the docker-compose.yml, EasyPanel will show a form to fill in:

**Required environment variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `DB_PASSWORD` | Random strong password | Save this! Use same for DB and backend |

Example:
```
DB_PASSWORD=SuperSecure!Pass123
```

---

## Step 4: Connect to GitHub (for auto-deploy)

### 4.1 Create GitHub Personal Access Token

1. Go to **GitHub** → **Settings** → **Developer Settings** → **Personal Access Tokens** → **Fine-grained tokens**
2. Click **"Generate new token"**
3. Configure:
   - **Token name**: `easypanel-kombass`
   - **Repository access**: Select `kombass` repo only
   - **Permissions needed**:
     - ✅ `Contents` (read & write)
     - ✅ `Webhooks` (read & write)
     - ✅ `Workflows` (read & write)
4. **Generate** and copy the token

### 4.2 Add to EasyPanel

In EasyPanel project settings:
1. Go to **Code Source** or **Git Settings**
2. Select **GitHub**
3. Paste your Personal Access Token
4. Select your **Repository**: `your-username/kombass`
5. Select **Branch**: `main`
6. Click **Enable Auto-Deploy**

**Result:** Every `git push origin main` now triggers auto-deployment automatically! 🎉

---

## Step 5: Configure Domain and SSL

### 5.1 In EasyPanel, set domain

In the project settings:
1. Go to **Domains** or **Networking**
2. Add domain: `kombass.maximepico.com`
3. EasyPanel auto-provisions **Let's Encrypt** SSL (free)
4. HTTPS redirect is automatic

### 5.2 Verify DNS

Make sure your domain's DNS is pointing to your Hetzner IP:
```
A record: kombass.maximepico.com → <your-hetzner-ip>
```

---

## Step 6: Configure Routes/Reverse Proxy

EasyPanel auto-creates routes. Verify these exist:

| Path | Backend | Protocol |
|------|---------|----------|
| `/` | backend:3000 | HTTP (proxied to HTTPS) |
| `/api/*` | backend:3000 | HTTP |
| `/socket.io/*` | backend:3000 | WebSocket |

**If using EasyPanel's Traefik/nginx**, these should be auto-configured. If not, manually add:

```
Frontend: https://kombass.maximepico.com
Path: /
Backend: backend:3000
Type: HTTP
```

All routes go to the same backend (EasyPanel handles SPA routing).

---

## Step 7: Deploy!

### 7.1 In EasyPanel, click "Deploy" or "Start"

EasyPanel will:
1. ✅ Pull Docker images (postgres:16-alpine, node:20-alpine)
2. ✅ Build your Dockerfile
3. ✅ Create containers and networks
4. ✅ Set up volumes
5. ✅ Configure reverse proxy
6. ✅ Provision SSL cert
7. ✅ Start services

**Estimated time:** 2-5 minutes

### 7.2 Watch logs in EasyPanel UI

- Services → `backend` → Logs
- Services → `db` → Logs
- Watch for any errors

---

## Step 8: Test Deployment

### 8.1 Check if running

```bash
curl https://kombass.maximepico.com
# Should return HTML (React app)

curl https://kombass.maximepico.com/api/room
# Should return: {"roomId": "...", "sessionToken": "..."}
```

### 8.2 In browser

1. Open `https://kombass.maximepico.com`
2. Click PLAY
3. Verify game works end-to-end
4. Check browser console (F12) for errors

### 8.3 Check logs in EasyPanel

If something fails:
- EasyPanel Dashboard → Services → Select service → Logs
- Look for error messages
- Common issues:
  - Database not initialized
  - PORT mismatch
  - DATABASE_URL wrong format

---

## Step 9: Auto-Deployments

Once GitHub is connected, the workflow is:

```
You: git push origin main
     ↓
GitHub: Runs tests (if CI/CD configured)
        ↓
EasyPanel webhook: Triggered
                   ↓
EasyPanel: git pull, rebuild Docker, restart containers
           ↓
Your app: Updated at https://kombass.maximepico.com
```

**No manual steps needed!** 🎉

---

## Updating Your App

### Normal workflow:

```bash
# Make changes
git add .
git commit -m "Add feature"
git push origin main

# EasyPanel auto-deploys within 30 seconds
```

### View logs of deployment:

In EasyPanel:
- Dashboard → Services → backend → Logs
- Last lines show if deploy succeeded or failed

---

## Database & Backups

### In EasyPanel:

1. **Services** → **db** (PostgreSQL)
2. Look for **Backup**, **Export**, or **Snapshots** option
3. Set up automated backups (recommended: daily)

### Manual backup (from EasyPanel):

Click **Services** → **db** → **Export** or **Backup**

---

## Troubleshooting

### Container won't start

**In EasyPanel:**
- Services → [service name] → Logs
- Check for error messages
- Common: DATABASE_URL format wrong, PORT conflict

### Database won't initialize

- Check `DB_PASSWORD` matches in both `db` and `backend` services
- Check DATABASE_URL format: `postgresql://user:pass@host:port/db`

### Domain not resolving

- Verify DNS A record points to Hetzner IP
- Wait 5-10 minutes for DNS to propagate
- Test: `nslookup kombass.maximepico.com`

### SSL certificate failing

- Let's Encrypt usually auto-provisions in EasyPanel
- If failing: check domain DNS is correct, try manual renew in EasyPanel

### Frontend not loading

- Ensure your `/index.html` is in the React `build/` folder
- Backend must serve static files (or EasyPanel nginx does)
- Check reverse proxy routes are correct

---

## Scaling & Performance

### As you grow:

EasyPanel allows you to:
- Scale container resources (CPU, RAM)
- Add more backend instances (load balance)
- Upgrade database (vertically scale)
- Enable caching layers

(All in the UI — no command line needed)

---

## Next Steps

1. **Create GitHub token** (Step 4.1)
2. **Paste docker-compose.yml into EasyPanel** (Step 2)
3. **Add environment variable** `DB_PASSWORD` (Step 3)
4. **Click Deploy** (Step 7)
5. **Test** (Step 8)

**You're done!** Your app is live with auto-deploy. 🚀

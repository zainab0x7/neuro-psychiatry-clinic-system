# Final Low-Cost Production Deployment Manual

## Personal Clinic EMR — Psychiatry Practice Management System

---

## 1. Executive Summary & Deployment Architecture

This document serves as the authoritative production deployment and operational guide for the **Personal Clinic EMR — Psychiatry Practice Management System**.

The application is deployed using a single-server, low-cost infrastructure model that eliminates recurring SaaS fees and third-party cloud subscriptions while maintaining strict security, data privacy, and reliability standards for clinical operations.

### Single-VPS Deployment Architecture Topology

```
                              [ Web Browsers / Clients ]
                                          │
                                          │ HTTPS (Port 443) / TLS 1.3
                                          ▼
                         ┌──────────────────────────────────┐
                         │    Nginx Reverse Proxy & SSL     │
                         │     (Certbot / Let's Encrypt)    │
                         └────────────────┬─────────────────┘
                                          │
                ┌─────────────────────────┴─────────────────────────┐
                │ Proxy /                                           │ Proxy /api/
                ▼                                                   ▼
┌──────────────────────────────────────┐             ┌──────────────────────────────────────┐
│       Next.js Frontend App           │             │        Express.js Backend API         │
│  Port: 3000 (localhost only)         │             │    Port: 5000 (localhost only)       │
│  Managed by PM2 ("emr-frontend")     │             │    Managed by PM2 ("emr-backend")    │
└──────────────────────────────────────┘             └──────────────────┬───────────────────┘
                                                                        │
                                                                        │ MONGODB_URI (Internal)
                                                                        ▼
                                                     ┌──────────────────────────────────────┐
                                                     │      MongoDB Community Server        │
                                                     │  Port: 27017 (127.0.0.1 bound only)  │
                                                     │  Authenticated Database User         │
                                                     └──────────────────────────────────────┘
```

---

## 2. Server & Infrastructure Requirements

### Recommended VPS Hosting Providers
- Hetzner Cloud (CX22 / CX32)
- DigitalOcean Droplet
- Linode / Akamai
- Vultr

### Hardware Specifications Matrix

| Resource | Minimum Required Specification | Recommended Production Specification |
| :--- | :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS (x86_64) | Ubuntu 24.04 LTS (x86_64) |
| **vCPU** | 2 Virtual Cores | 4 Virtual Cores |
| **RAM** | 4 GB System RAM | 8 GB System RAM |
| **Storage** | 40 GB NVMe / SSD | 80 GB NVMe SSD |
| **Public IP** | 1 Dedicated IPv4 Address | 1 Dedicated IPv4 Address (+ optional IPv6) |
| **Firewall** | UFW / Provider Cloud Firewall | UFW + Cloud Security Group |
| **SSH** | OpenSSH with Key Authentication | OpenSSH on custom port / Ed25519 Keys |

---

## 3. Server Initialization & Ubuntu OS Setup

Connect to your fresh Ubuntu VPS via SSH:

```bash
ssh root@YOUR_SERVER_IP
```

### 3.1 Update Base Operating System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip build-essential ufw software-properties-common ca-certificates gnupg
```

### 3.2 Configure Server Timezone & Locale
Set timezone to UTC or your clinic local timezone:
```bash
sudo timedatectl set-timezone UTC
```

### 3.3 Create System Deployment User
Create a non-root administrative user for deployment:
```bash
sudo adduser emr-deploy
sudo usermod -aG sudo emr-deploy
```

Switch to the deployment user:
```bash
su - emr-deploy
```

---

## 4. Software Installation & Configuration

### 4.1 Install Node.js v20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node -v   # Expected: v20.x.x
npm -v    # Expected: 10.x.x
```

### 4.2 Install PM2 Process Manager
```bash
sudo npm install -g pm2
```

---

## 5. MongoDB Community Server Setup & Security Hardening

### 5.1 Install MongoDB Community Server (v7.0 / v6.0)
Import MongoDB public GPG key and repository:
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg --oarmor --output /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
```

Start and enable MongoDB systemd service:
```bash
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

### 5.2 Configure MongoDB Network Binding & Logging
Edit `/etc/mongod.conf`:
```bash
sudo nano /etc/mongod.conf
```

Verify and update the `net` and `security` sections:
```yaml
# /etc/mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1  # CRITICAL: Binds MongoDB exclusively to localhost

security:
  authorization: enabled  # Enforces database user authentication
```

Restart MongoDB to apply security configuration:
```bash
sudo systemctl restart mongod
```

### 5.3 Create Dedicated Application Database & User
Access the MongoDB shell:
```bash
mongosh
```

Execute the database user creation script in `mongosh`:
```javascript
// 1. Switch to admin database to create root admin
use admin;
db.createUser({
  user: "adminUser",
  pwd: "<GENERATE_A_STRONG_UNIQUE_PASSWORD>",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, { role: "readWriteAnyDatabase", db: "admin" } ]
});

// 2. Switch to clinic production database
use psychiatrist_emr;

// 3. Create dedicated application user with scoped permissions
db.createUser({
  user: "emr_app_user",
  pwd: "<GENERATE_A_STRONG_UNIQUE_PASSWORD>",
  roles: [
    { role: "readWrite", db: "psychiatrist_emr" }
  ]
});

// Verify users
show users;
exit;
```

Test application user login:
```bash
mongosh -u emr_app_user -p --authenticationDatabase psychiatrist_emr 127.0.0.1:27017/psychiatrist_emr
```

---

## 6. Project Code Deployment & Build Steps

### 6.1 Clone Git Repository
```bash
cd /var/www
sudo mkdir psychiatrist-system
sudo chown -R emr-deploy:emr-deploy /var/www/psychiatrist-system

git clone https://github.com/YOUR_REPO/psychiatrist-system.git /var/www/psychiatrist-system
cd /var/www/psychiatrist-system/psychiatrist-system
```

### 6.2 Install Production Dependencies
```bash
npm ci
```

### 6.3 Run Production Build Checks
```bash
# Verify TypeScript compiler checks
npx tsc --noEmit

# Build Next.js production bundle
npm run build
```

---

## 7. Production Environment Configuration

Create `.env.production` in `/var/www/psychiatrist-system/psychiatrist-system`:

```bash
nano .env.production
```

Populate with secure production values:

```env
# ==============================================================================
# Production Environment Variables - Personal Clinic EMR
# ==============================================================================

# Server Runtime Environment
NODE_ENV=production
PORT=5000

# Production MongoDB Connection String (Localhost, Authenticated)
MONGODB_URI=mongodb://emr_app_user:<GENERATE_A_STRONG_UNIQUE_PASSWORD>@127.0.0.1:27017/psychiatrist_emr?authSource=psychiatrist_emr

# Security Secrets (Must be unique, 32+ characters)
# Generate via: openssl rand -hex 32
JWT_SECRET=<GENERATE_A_STRONG_UNIQUE_32_PLUS_CHAR_SECRET>
SESSION_SECRET=<GENERATE_A_STRONG_UNIQUE_32_PLUS_CHAR_SECRET>

# Frontend Client Public API URL
NEXT_PUBLIC_API_URL=https://emr.yourclinicdomain.com

# Production CORS Whitelist
ALLOWED_ORIGINS=https://emr.yourclinicdomain.com

# Initial Administrator Bootstrap Credentials (Used ONLY on initial database setup)
INITIAL_ADMIN_EMAIL=admin@yourclinicdomain.com
INITIAL_ADMIN_PASSWORD=<GENERATE_A_STRONG_UNIQUE_PASSWORD>
```

Restrict file permissions so only `emr-deploy` can read `.env.production`:
```bash
chmod 600 .env.production
```

---

## 8. Process Management (PM2 Setup)

The project includes an `ecosystem.config.js` file for single-command management of both the Express API backend and Next.js frontend processes.

### 8.1 Start Application Processes
```bash
pm2 start ecosystem.config.js
```

Or start processes manually via npm scripts:
```bash
pm2 start npm --name "emr-backend" -- run backend
pm2 start npm --name "emr-frontend" -- run start
```

### 8.2 Save Process Snapshot & Configure System Auto-Boot
```bash
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u emr-deploy --hp /home/emr-deploy
```

### 8.3 PM2 Monitoring Commands
```bash
pm2 status                  # View status of emr-backend & emr-frontend
pm2 logs                    # Stream live aggregated logs
pm2 logs emr-backend        # Stream backend logs only
pm2 logs emr-frontend       # Stream frontend logs only
pm2 restart all             # Restart both services
```

---

## 9. Nginx Reverse Proxy Setup

### 9.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 9.2 Configure Virtual Host Configuration
Copy `nginx/emr.conf` to `/etc/nginx/sites-available/emr.conf`:

```bash
sudo cp /var/www/psychiatrist-system/psychiatrist-system/nginx/emr.conf /etc/nginx/sites-available/emr.conf
```

Replace `emr.yourclinicdomain.com` with your client's actual domain name in `/etc/nginx/sites-available/emr.conf`.

Enable the site configuration:
```bash
sudo ln -s /etc/nginx/sites-available/emr.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Test Nginx configuration syntax:
```bash
sudo nginx -t
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

---

## 10. SSL/TLS Certificate Setup (Let's Encrypt / Certbot)

### 10.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Obtain Free SSL Certificate
```bash
sudo certbot --nginx -d emr.yourclinicdomain.com
```

Certbot will automatically verify domain ownership, issue a 90-day TLS certificate, and update the Nginx configuration.

### 10.3 Verify Automatic Renewal
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## 11. Firewall Configuration (UFW)

Configure Uncomplicated Firewall (UFW) to block unneeded public ports:

```bash
# Allow essential services
sudo ufw allow OpenSSH       # Port 22
sudo ufw allow 80/tcp        # Port 80
sudo ufw allow 443/tcp       # Port 443

# Ensure database and Node ports are strictly forbidden publicly
sudo ufw deny 27017/tcp
sudo ufw deny 5000/tcp
sudo ufw deny 3000/tcp

# Enable firewall
sudo ufw enable
sudo ufw status verbose
```

---

## 12. Automated MongoDB Backup System

### 12.1 Backup Script Setup
The automated backup script is located at `scripts/backup-mongodb.sh`.

Ensure it is executable:
```bash
chmod +x /var/www/psychiatrist-system/psychiatrist-system/scripts/backup-mongodb.sh
```

### 12.2 Configure Daily Automated Cron Job
Open crontab editor:
```bash
crontab -e
```

Add the following crontab entry for daily execution at 02:00 AM:
```cron
0 2 * * * /var/www/psychiatrist-system/psychiatrist-system/scripts/backup-mongodb.sh >/dev/null 2>&1
```

The script will:
1. Trigger `mongodump` using gzip compression.
2. Store timestamped archives in `/var/backups/psychiatrist_emr/`.
3. Set file permissions to `600` (root/owner only).
4. Automatically purge backup files older than 14 days.

> [!WARNING]
> **Disaster Recovery Notice:** Local VPS backups protect against software issues, accidental data deletion, and database corruption, but do NOT fully protect against total VPS loss or server hardware destruction. It is strongly recommended to periodically download backup snapshots offsite (e.g. via secure SSH `scp` or via the in-app Admin JSON export feature) to a secure local device without requiring a paid backup SaaS service.

---

## 13. Database Disaster Recovery & Restoration Procedure

To restore a database backup archive in case of server failure or corruption:

### Step 1: Copy Backup Archive to Target Server
If restoring on a fresh VPS, transfer the `.gz` archive file to `/var/backups/psychiatrist_emr/`.

### Step 2: Execute `mongorestore` Command
```bash
mongorestore --uri="mongodb://emr_app_user:<GENERATE_A_STRONG_UNIQUE_PASSWORD>@127.0.0.1:27017/psychiatrist_emr?authSource=psychiatrist_emr" \
  --archive=/var/backups/psychiatrist_emr/emr_backup_YYYYMMDD_HHMMSS.gz \
  --gzip \
  --drop
```

> [!CAUTION]
> The `--drop` flag will replace existing database collections with the snapshot data. Use with caution.

### Step 3: Verify Restoration
```bash
mongosh -u emr_app_user -p --authenticationDatabase psychiatrist_emr 127.0.0.1:27017/psychiatrist_emr --eval "db.patients.countDocuments()"
```

---

## 14. Health Check & Production Verification Protocol

### 14.1 Backend Health API Verification
Run from terminal or external client:
```bash
curl -i https://emr.yourclinicdomain.com/api/health
```

**Expected HTTP Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Psychiatry EMR Backend is running",
  "timestamp": "2026-09-27T16:00:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "ready": true
  }
}
```

### 14.2 End-to-End Workflow Verification Checklist
Log in to `https://emr.yourclinicdomain.com` with initial credentials and verify:
1. **ADMIN Login:** Access system settings, verify user management interface.
2. **Staff Creation:** Register 1 Doctor, 1 Receptionist, 1 Therapist.
3. **RECEPTION Role:** Register new patient, book appointment slot.
4. **DOCTOR Role:** Conduct consultation, issue digital prescription.
5. **THERAPIST Role:** Record CBT session notes.
6. **RECEPTION Role:** Log fee payment, issue receipt `#RCP-...`.
7. **ADMIN Role:** Access Audit Logs, verify event trails captured.
8. **ADMIN Role:** Trigger `/api/backup/export` database snapshot.

---

## 15. Initial Production Database Setup & Admin Bootstrap

1. Ensure `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` are defined in `.env.production`.
2. On first server launch, `seedDefaultAdmin()` creates a single clean Administrator account (`USR-001`).
3. Log in immediately via `https://emr.yourclinicdomain.com/login`.
4. Change the default password in **Settings / Profile**.
5. Create staff accounts for clinic personnel.
6. Comment out or remove `INITIAL_ADMIN_PASSWORD` from `.env.production`.

---

## 16. Security Verification & Compliance Audit

- [x] **Zero Cloud SaaS Exposure:** Database self-hosted locally on VPS.
- [x] **Database Isolation:** Port `27017` bound strictly to `127.0.0.1` and blocked by UFW.
- [x] **Authentication:** Dedicated DB user created; root DB credentials omitted from application.
- [x] **HTTPS Enforcement:** SSL active via Let's Encrypt; HTTP 80 redirects to HTTPS 443.
- [x] **CORS Protection:** Whitelisted to production domain `emr.yourclinicdomain.com`.
- [x] **Production Seed Protection:** Demo seed routes return `403 Forbidden` when `NODE_ENV=production`.
- [x] **Credential Exclusion:** `passwordHash` stripped from all API outputs via Mongoose `toJSON`.
- [x] **Audit Trail Protection:** Sensitive clinical/financial operations logged server-side.
- [x] **Git Safety:** `.env.production` excluded from git tracking.

---

## 17. Troubleshooting Guide

| Issue / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **502 Bad Gateway (Nginx)** | Express/Next service down | Run `pm2 status`. Restart processes via `pm2 restart all`. |
| **Database Connection Failed** | MongoDB service stopped or invalid credentials | Check `sudo systemctl status mongod`. Verify `MONGODB_URI` password in `.env.production`. |
| **CORS Policy Error** | `ALLOWED_ORIGINS` mismatch | Ensure `ALLOWED_ORIGINS` in `.env.production` exactly matches `https://emr.yourclinicdomain.com`. |
| **Port 5000 Already in Use** | Ghost Node process running | Run `sudo lsof -i :5000` and `kill -9 <PID>`. Restart PM2. |
| **Certbot Renewal Failure** | Port 80 blocked by UFW | Ensure `sudo ufw allow 80/tcp` is active. |

---

## 18. Emergency Rollback Procedure

If a deployed version causes runtime errors:

1. **Stop Services:**
   ```bash
   pm2 stop all
   ```
2. **Revert Git Repository:**
   ```bash
   git checkout v1.0.0-stable
   ```
3. **Rebuild Application:**
   ```bash
   npm ci && npm run build
   ```
4. **Restore Database Snapshot (if data modification occurred):**
   ```bash
   mongorestore --uri="$MONGODB_URI" --archive=/var/backups/psychiatrist_emr/PRE_DEPLOYMENT_BACKUP.gz --gzip --drop
   ```
5. **Restart PM2:**
   ```bash
   pm2 restart all
   ```

---

## 19. Client Handover & Data Ownership Protocol

The client retains 100% data ownership and server control:

1. **Server Access:** Client holds SSH root/sudo credentials to the VPS.
2. **Database Location:** All patient charts reside locally in `/var/lib/mongodb`.
3. **Data Export:** Admins can export full database JSON archives at any time via **Admin -> Backup & Export**.
4. **Domain Access:** Client controls DNS records via their domain registrar.
5. **Source Code:** Full source code delivered in Git repository.

---

## 20. Cost Control Analysis & Non-Required Services

### Estimated Monthly Infrastructure Cost
- **VPS Server (2 vCPU / 4 GB RAM SSD):** ~$10.00 – $20.00 / month
- **Domain Name Renewal:** ~$10.00 – $15.00 / year (approx $1.00 / month)
- **Total Recurring Operating Cost:** **~$11.00 – $21.00 / month**

### Intentionally Excluded Paid Services ($0 Expense)
- ❌ **NO MongoDB Atlas Paid Cluster** ($0)
- ❌ **NO Vercel Pro Frontend Hosting** ($0)
- ❌ **NO Render Paid Web Services** ($0)
- ❌ **NO Paid Commercial SSL Certificate** ($0 - Let's Encrypt)
- ❌ **NO Paid Backup SaaS (Datadog/AWS S3)** ($0 - Local mongodump cron)
- ❌ **NO Paid APM / Monitoring SaaS** ($0 - PM2 + Nginx logs)
- ❌ **NO Third-Party Paid API Subscriptions** ($0)

#!/bin/bash
# ==============================================================================
# Production MongoDB Automated Backup Script - Personal Clinic EMR
# Path: /var/www/psychiatrist-system/scripts/backup-mongodb.sh
# ==============================================================================
set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/psychiatrist_emr"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=14
LOG_FILE="/var/log/emr/mongodb_backup.log"

# Ensure backup and log directories exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Load environment variables safely if .env.production exists
if [ -f "/var/www/psychiatrist-system/.env.production" ]; then
    export $(grep -v '^#' /var/www/psychiatrist-system/.env.production | xargs)
fi

# Fallback URI if MONGODB_URI is not set
DB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/psychiatrist_emr}"
BACKUP_FILE="${BACKUP_DIR}/emr_backup_${TIMESTAMP}.gz"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Starting automated MongoDB dump..." >> "$LOG_FILE"

# Run mongodump with gzip compression
if mongodump --uri="$DB_URI" --archive="$BACKUP_FILE" --gzip >> "$LOG_FILE" 2>&1; then
    chmod 600 "$BACKUP_FILE"
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Backup successfully created: ${BACKUP_FILE}" >> "$LOG_FILE"
else
    echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] ERROR: Backup failed!" >> "$LOG_FILE"
    exit 1
fi

# Apply retention policy: remove backups older than RETENTION_DAYS
echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Cleaning up backups older than ${RETENTION_DAYS} days..." >> "$LOG_FILE"
find "$BACKUP_DIR" -name "emr_backup_*.gz" -type f -mtime +${RETENTION_DAYS} -delete >> "$LOG_FILE" 2>&1

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Backup process finished successfully." >> "$LOG_FILE"

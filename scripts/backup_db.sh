#!/bin/bash
# Basic PostgreSQL backup script
# Set env vars
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
docker compose exec -T postgres pg_dump -U stl_user stl_db > "$BACKUP_DIR/stl_backup_$TIMESTAMP.sql"
echo "Backup saved to $BACKUP_DIR/stl_backup_$TIMESTAMP.sql"
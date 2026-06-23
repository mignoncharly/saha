# STL Deployment Guide

## Prerequisites
- Ubuntu 22.04 VPS
- Docker & Docker Compose installed
- Domain name pointed to server

## Steps

1. Clone repository: `git clone ...`
2. Copy `.env.example` to `.env` and fill in:
   - `SECRET_KEY` (use `openssl rand -hex 32`)
   - `POSTGRES_PASSWORD`
   - `DJANGO_SETTINGS_MODULE=config.settings.production`
   - `ALLOWED_HOSTS=your-domain.com`
   - `CORS_ALLOWED_ORIGINS=https://your-domain.com`
   - `NEXT_PUBLIC_API_URL=https://your-domain.com/api`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER=...`
   - Email settings
   - VAPID keys
3. Generate VAPID keys: `bash scripts/generate_vapid_keys.sh`
4. Build & start: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
5. Apply migrations: `docker compose exec backend python manage.py migrate`
6. Create admin: `docker compose exec backend python manage.py createsuperuser`
7. Load seed data: `docker compose exec backend python manage.py seed_initial_data`
8. Set up Nginx as reverse proxy with SSL (Let's Encrypt) using `nginx/sites/stl.conf`
9. Configure firewall: allow 80/443 only
10. Set up daily database backup: `crontab -e` add `0 2 * * * /path/to/scripts/backup_db.sh`

## Health checks
- Frontend: https://your-domain.com
- Admin: https://your-domain.com/admin/
- API: https://your-domain.com/api/services/
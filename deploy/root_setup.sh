#!/usr/bin/env bash
#
# SAHA-STL standalone deployment — root setup.
# Run with:  sudo bash /home/mignon/saha/deploy/root_setup.sh
#
# Idempotent: safe to re-run. Performs only the steps that need root, and drops
# to user 'mignon' for Django management commands.
#
set -euo pipefail

APP_USER=mignon
APP_DIR=/home/mignon/saha
BACKEND=$APP_DIR/backend
VENV=$BACKEND/.venv/bin
SECRETS=$APP_DIR/deploy/.secrets.json
PGDB=saha_db
PGUSER=saha_user

if [[ $EUID -ne 0 ]]; then echo "Must run as root (use sudo)."; exit 1; fi
command -v jq >/dev/null 2>&1 || true

read_secret() { python3 -c "import json,sys;print(json.load(open('$SECRETS'))['$1'])"; }
DB_PASSWORD=$(read_secret DB_PASSWORD)
ADMIN_PASSWORD=$(read_secret ADMIN_PASSWORD)

echo "==================================================================="
echo " 1/7  PostgreSQL: dedicated role + database"
echo "==================================================================="
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$PGUSER') THEN
      CREATE ROLE $PGUSER LOGIN PASSWORD '$DB_PASSWORD';
   ELSE
      ALTER ROLE $PGUSER LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;
SQL
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$PGDB'" | grep -q 1 \
  || sudo -u postgres createdb -O "$PGUSER" "$PGDB"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER DATABASE $PGDB OWNER TO $PGUSER;"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE $PGDB TO $PGUSER;"
echo "   -> database $PGDB owned by $PGUSER ready"

echo "==================================================================="
echo " 2/7  Redis: dedicated saha-redis instance (port 6383)"
echo "==================================================================="
install -m 644 "$APP_DIR/deploy/systemd/saha-redis.service" /etc/systemd/system/saha-redis.service
chown -R $APP_USER:$APP_USER "$APP_DIR/deploy/redis-data"
systemctl daemon-reload
systemctl enable --now saha-redis.service
sleep 2
systemctl is-active --quiet saha-redis && echo "   -> saha-redis active" || { echo "   !! saha-redis failed"; journalctl -u saha-redis -n 20 --no-pager; exit 1; }

echo "==================================================================="
echo " 3/7  Django: migrate, collectstatic, seed, superuser (as $APP_USER)"
echo "==================================================================="
RUN="sudo -u $APP_USER env DJANGO_SETTINGS_MODULE=config.settings.production"
( cd "$BACKEND" && $RUN "$VENV/python" manage.py migrate --noinput )
( cd "$BACKEND" && $RUN "$VENV/python" manage.py collectstatic --noinput )
echo "   -> seeding initial data (best-effort)"
( cd "$BACKEND" && $RUN "$VENV/python" manage.py seed_initial_data ) || echo "   (seed skipped/failed — non-fatal)"
echo "   -> ensuring admin superuser (admin@gestionatech.de)"
( cd "$BACKEND" && $RUN ADMIN_PW="$ADMIN_PASSWORD" "$VENV/python" manage.py shell <<'PYEOF'
import os
from django.contrib.auth import get_user_model
U = get_user_model()
email = "admin@gestionatech.de"
pw = os.environ["ADMIN_PW"]
u, created = U.objects.get_or_create(email=email, defaults={"role": "admin", "is_staff": True, "is_superuser": True, "is_active": True})
u.is_staff = True; u.is_superuser = True; u.is_active = True
if hasattr(u, "role"): u.role = "admin"
if hasattr(u, "email_verified"): u.email_verified = True
u.set_password(pw)
u.save()
print("   admin", "created" if created else "updated", "->", email)
PYEOF
)

echo "==================================================================="
echo " 4/7  systemd: install app services"
echo "==================================================================="
for svc in saha-api saha-worker saha-beat saha-frontend; do
  install -m 644 "$APP_DIR/deploy/systemd/$svc.service" "/etc/systemd/system/$svc.service"
done
systemctl daemon-reload
systemctl enable --now saha-api.service saha-worker.service saha-beat.service saha-frontend.service

echo "==================================================================="
echo " 5/7  nginx: install site configs (HTTP)"
echo "==================================================================="
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
for site in saha-stl.docufisc.de api-saha.docufisc.de; do
  install -m 644 "$APP_DIR/deploy/nginx/$site" "/etc/nginx/sites-available/$site"
  ln -sf "/etc/nginx/sites-available/$site" "/etc/nginx/sites-enabled/$site"
done
nginx -t
systemctl reload nginx
echo "   -> nginx reloaded"

echo "==================================================================="
echo " 6/7  Service status"
echo "==================================================================="
sleep 3
for svc in saha-redis saha-api saha-worker saha-beat saha-frontend; do
  printf "   %-18s %s\n" "$svc" "$(systemctl is-active $svc.service)"
done

echo "==================================================================="
echo " 7/7  Local smoke test"
echo "==================================================================="
echo -n "   API   (127.0.0.1:8030/api/) -> "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 10 http://127.0.0.1:8030/api/ || echo "no response"
echo -n "   Front (127.0.0.1:3030/)     -> "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 15 http://127.0.0.1:3030/ || echo "no response"

echo
echo "==================================================================="
echo " DONE. Next (after DNS A-records point to 82.165.94.233):"
echo "   sudo certbot --nginx -d saha-stl.docufisc.de -d api-saha.docufisc.de"
echo "==================================================================="

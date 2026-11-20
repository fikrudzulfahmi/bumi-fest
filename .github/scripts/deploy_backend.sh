#!/usr/bin/env bash
# Deploy backend via raw ssh (bukan appleboy agar error tidak di-mask).
set -e

SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USER:-}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-}"
FRESH="${FRESH:-false}"
BRANCH="${BRANCH:-main}"

fase() {
  label="$1"; shift
  log=/tmp/fase.log
  if "$@" >"$log" 2>&1; then
    echo "-- $label: OK"; tail -3 "$log"
  else
    echo "::error title=GAGAL: $label::$(tail -c 400 "$log" | tr '\n' ' ')"
    exit 1
  fi
}

REMOTE="set -e
cd '$DEPLOY_PATH' 2>/dev/null || { echo 'PATH_TIDAK_ADA'; exit 1; }
export PATH=\"\$HOME/bin:/usr/local/bin:/usr/bin:/bin:/opt/cpanel/composer/bin:\$PATH\"
git pull origin '$BRANCH'
grep -qE '^APP_KEY=base64:.+' .env 2>/dev/null || php artisan key:generate --force
php artisan config:clear
COMPOSER=\$(command -v composer || true)
if [ -z \"\$COMPOSER\" ] && [ -f \"\$HOME/composer.phar\" ]; then COMPOSER=\"php \$HOME/composer.phar\"; fi
if [ -z \"\$COMPOSER\" ]; then echo 'COMPOSER_TIDAK_ADA'; exit 1; fi
\$COMPOSER install --no-dev --optimize-autoloader --no-interaction
if [ '$FRESH' = true ]; then php artisan migrate:fresh --force --seed; else php artisan migrate --force; fi
php artisan route:clear && php artisan route:cache
php artisan config:clear && php artisan config:cache
php artisan view:clear && php artisan view:cache
php artisan storage:link 2>/dev/null || true
php artisan optimize"

ssh -i ~/.ssh/deploy_key -p "$SSH_PORT" -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=30 "$SSH_USER@$SSH_HOST" "$REMOTE"

# Sisa (backup key normalisasi tidak perlu di remote) — verifikasi ringan
echo "::notice title=DEPLOY SELESAI::git pull + composer + migrate + cache OK"

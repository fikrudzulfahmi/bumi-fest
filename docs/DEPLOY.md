# Deploy Bumifest Web

Ringkas dari `docs/BLUEPRINT.md` §15. Target produksi: **PHP 8.3, MySQL 8, Nginx + PHP-FPM**
(hosting cPanel/shared seperti Dewaweb juga didukung).

## Prasyarat server

- PHP 8.3 — ekstensi: `gd`, `intl`, `zip`, `mbstring`, `pdo_mysql`, `dom` (dompdf).
- MySQL 8 / MariaDB 10.6+.
- Nginx `client_max_body_size 60M`; PHP `upload_max_filesize ≥ 60M`, `post_max_size ≥ 60M`.
- Cron: `* * * * * php /path/artisan schedule:run` (menjalankan `invoices:expire` & backup harian).
- Supervisor/queue worker: `php artisan queue:work --tries=3 --timeout=120`.

## Rilis (per push / rilis manual)

```bash
composer install --no-dev --optimize-autoloader --classmap-authoritative
npm ci && npm run build
php artisan migrate --force
php artisan config:clear && php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
php artisan optimize
```

`.env` produksi wajib:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<domain>
APP_KEY=base64:...           # generate bila kosong: php artisan key:generate --force
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=bumifest
DB_USERNAME=...
DB_PASSWORD=...
QUEUE_CONNECTION=database
CACHE_STORE=database
SESSION_DRIVER=database
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_FROM_ADDRESS=...
WHATSAPP_DRIVER=log          # ganti saat penyedia WA dipilih (P2)
ADMIN_EMAIL=...
ADMIN_PASSWORD=...           # dipakai DatabaseSeeder
```

## Auto-deploy (GitHub Actions)

Workflow `.github/workflows/deploy.yml` SSH ke server lalu `git pull` +
`composer install --no-dev` + `migrate --force` + rebuild cache. Secrets yang harus
diisi di repo (Settings → Secrets and variables → Actions):

| Secret | Isi |
|---|---|
| `SSH_HOST` | IP/hostname server |
| `SSH_USER` | username SSH (cPanel) |
| `SSH_KEY` | private key deploy (base64 satu baris) |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | path folder repo di server (mis. `bumi-fest`) |

Lihat `cpanel-github-actions-deploy` skill untuk setup deploy key dan
`templates/deploy-laravel-api.yml`.

## Backup & restore

- Backup DB harian pukul 02:30 (`backup:run --only-db`), retensi 7 hari
  (`backup:clean` 03:30). Konfigurasi di `config/backup.php`.
- **Restore**: unduh arsip terbaru dari disk backup → `php artisan backup:restore`
  lalu `php artisan migrate --force` (untuk skema terkini). **Uji restore sekali
  sebelum pendaftaran dibuka.**

## Catatan penting

- Uji konkurensi kuota & uji beban WAJIB dijalankan di MySQL — SQLite tidak
  menghormati `lockForUpdate`. Lihat `tests/load/` dan skrip kuota.
- `APP_DEBUG` harus `false` di produksi (mencegah kebocoran `.env` lewat halaman error).
- Docroot Nginx harus menunjuk ke folder `public/` repo (jangan root repo), agar
  `.env` tidak bisa diunduh publik.

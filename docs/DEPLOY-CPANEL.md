# Deploy Bumi Fest ke cPanel (Dewaweb) — Panduan Klik-demi-Klik

Ikuti urut. Target akhir: push ke GitHub → GitHub Actions otomatis deploy ke server cPanel.
Total ±30 menit. Butuh akses: cPanel, terminal (sekali, untuk deploy key), GitHub.

---

## BAGIAN A — Siapkan server (cPanel), sekali saja

### A1. Aktifkan SSH
1. Masuk cPanel → cari **Terminal** atau **SSH Access**.
2. Klik **SSH Access** → **Manage SSH Keys**.
3. Kalau belum ada key: **Generate a New Key** → isi nama `deploy` → password kosongkan → **Generate**.
4. Kembali ke **SSH Access**, di daftar **Public Keys** → cari key `deploy` → klik **Manage** → **Authorize**.
5. Catat: username cPanel (terlihat di kanan atas cPanel) dan IP/hostname server (di **General Information → Shared IP Address**).

### A2. Buat subdomain (kalau belum ada)
1. cPanel → **Domains** → **Domains** (atau **Subdomains**).
2. **Create A New Domain** → isi Domain: `bumi.<domainanda>` → kosongkan Document Root (biarkan default `bumi.<domainanda>`).
3. **Submit**.

### A3. Buat database MySQL
1. cPanel → **MySQL® Databases**.
2. **Create New Database**: `bumi_fest` → Create.
3. **Add New User**: nama `bumi_user`, password kuat (catat!) → Create.
4. **Add User To Database**: pilih `bumi_user` + `bumi_fest` → **ALL PRIVILEGES** → Make Changes.
5. Catat: nama DB, user, password.

### A4. Clone repo (sekali, via SSH agar deploy key dipakai)
1. cPanel → **Git™ Version Control** → **Create**.
2. **Clone URL**: `git@github.com:fikrudzulfahmi/bumi-fest.git`.
3. **Repository Path**: `bumi-fest` (ini jadi `DEPLOY_PATH`).
4. **Repository Name**: `bumi-fest` → **Create**.

> Kalau menu Git™ gagal clone (key SSH cPanel belum ditambah ke GitHub), lanjut A5 dulu, lalu ulangi A4.

### A5. Tambah public key cPanel ke GitHub (untuk clone + git pull)
1. cPanel → **SSH Access** → **Manage SSH Keys** → **Public Keys** → key `deploy` → **View/Download**.
2. Salin seluruh isi (`ssh-rsa AAAA...`).
3. GitHub → **Settings** (ikon profil) → **SSH and GPG keys** → **New SSH key**.
4. Title `cpanel-deploy`, paste isi key → **Add SSH key**.
5. Kembali ke cPanel, ulangi A4 (Clone).

### A6. Arahkan docroot ke folder `public` (WAJIB — jangan root repo!)
1. cPanel → **Domains** → baris domain `bumi.<domainanda>` → **Manage**.
2. Cari **Document Root** → ubah ke `/home/<user>/bumi-fest/public` → **Update**.
3. Verifikasi: buat berkas uji di File Manager `bumi-fest/public/uji.txt` berisi `hi`, buka `https://bumi.<domainanda>/uji.txt` → harus tampil `hi`. Hapus berkas uji setelahnya.

### A7. Isi `.env` produksi
1. cPanel → **File Manager** → masuk folder `bumi-fest`.
2. Cari `.env` (klik **Settings** kanan atas → **Show Hidden Files (dotfiles)**).
3. Kalau belum ada, buat file baru bernama `.env`, salin isi `.env.example`, lalu isi:

```
APP_NAME="Bumi Fest"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://bumi.<domainanda>
APP_LOCALE=id
APP_FALLBACK_LOCALE=id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bumi_fest
DB_USERNAME=bumi_user
DB_PASSWORD=<password dari A3>

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

MAIL_MAILER=smtp
MAIL_HOST=<smtp server>
MAIL_PORT=587
MAIL_USERNAME=<email>
MAIL_PASSWORD=<password email>
MAIL_FROM_ADDRESS=<email pengirim>
MAIL_FROM_NAME="Bumi Fest"

WHATSAPP_DRIVER=log

ADMIN_EMAIL=<email admin>
ADMIN_PASSWORD=<password admin kuat>
```

> `ADMIN_EMAIL`/`ADMIN_PASSWORD` dipakai seeder untuk membuat akun admin saat `migrate --seed`.

---

## BAGIAN B — Deploy key untuk GitHub Actions

GitHub Actions butuh key SSH **terpisah** (bukan key login cPanel Anda) supaya kalau bocor bisa dicabut sendiri.

### B1. Generate key di lokal (terminal)
```bash
ssh-keygen -t ed25519 -f ~/.ssh/bumi_deploy -N "" -C "bumi-deploy"
```

### B2. Pasang public key di cPanel
1. `cat ~/.ssh/bumi_deploy.pub` → salin isinya.
2. cPanel → **SSH Access** → **Manage SSH Keys** → **Import Key**.
3. Nama `bumi_deploy` → paste isi public key → **Import**.
4. Di daftar Public Keys → **Manage** key `bumi_deploy` → **Authorize**.

### B3. Uji key dari lokal (PENTING, sebelum menyentuh GitHub)
```bash
ssh -i ~/.ssh/bumi_deploy -p 22 -o StrictHostKeyChecking=no -o BatchMode=yes <user>@<host> whoami
```
Harus mencetak username cPanel. Kalau gagal → periksa A1/B2 (key belum di-authorize).

### B4. Encode private key jadi base64 SATU BARIS
```bash
cat ~/.ssh/bumi_deploy | base64 -w0 ; echo
```
Salin seluruh output satu baris itu.

---

## BAGIAN C — Isi secrets GitHub

1. GitHub → repo `fikrudzulfahmi/bumi-fest` → **Settings** → **Secrets and variables** → **Actions**.
2. Klik **New repository secret**, isi satu-per-satu (form cuma 2 kolom: Name & Secret):

| Name | Secret (isi) |
|---|---|
| `SSH_HOST` | IP/hostname server (dari A1) |
| `SSH_USER` | username cPanel (dari A1) |
| `SSH_KEY` | output base64 satu baris dari B4 |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `bumi-fest` |

---

## BAGIAN D — Deploy pertama

1. Pastikan semua sudah ter-commit & ter-push (sudah: 21 commit di `main`).
2. GitHub → repo → **Actions** → workflow **Deploy (cPanel)** → **Run workflow**.
   - **fresh**: centang `true` untuk instalasi pertama (migrate:fresh + seed → buat admin).
3. Tunggu run selesai (harus hijau).

## BAGIAN E — Verifikasi

1. Buka `https://bumi.<domainanda>/` → halaman beranda tampil (bukan 500/404).
2. Buka `https://bumi.<domainanda>/login` → form masuk tampil.
3. Login `ADMIN_EMAIL` / `ADMIN_PASSWORD` → masuk ke `/admin`.
4. Buka `https://bumi.<domainanda>/up` → `{"status":"ok"}`.
5. Cek `https://bumi.<domainanda>/.env` → harus **403** (bukan menampilkan isi .env). Kalau malah terunduh → docroot A6 belum benar.

## Jika run merah

Buka **Actions → run → job → "Diagnostics (if failed)"** → baca annotation `P1..P8`.
Penyebab paling umum:
- `P1 folder deploy tidak ada` → A4 belum clone.
- `P7 APPKEY KOSONG` → `.env` belum ada (A7) — workflow sudah generate otomatis, tapi `.env` harus ada dulu untuk `DB_*`.
- `255` → SSH gagal konek (secret `SSH_HOST`/`SSH_KEY` salah; cek B3).
- `COMPOSER tidak ditemukan` → lihat catatan di bawah.

## Catatan cPanel Dewaweb (penting)
- **`composer install` butuh `exec`/`symlink`** yang kadang di-disable di shared hosting Dewaweb. Bila gagal: jalankan manual di terminal cPanel `composer install --no-dev --no-scripts` lalu `php artisan package:discover` sekali, dan edit `.github/workflows/deploy.yml` tambahkan `--no-scripts`.
- **Cron wajib**: cPanel → **Cron Jobs** → tambah:
  ```
  * * * * * cd /home/<user>/bumi-fest && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
  ```
  (menjalankan `invoices:expire` tiap jam + backup harian 02:30).
- **Queue worker** (untuk kirim email/WA/sertifikat di antrean): di cPanel bisa pakai Cron tiap menit:
  ```
  * * * * * cd /home/<user>/bumi-fest && /usr/local/bin/php artisan queue:work --stop-when-empty --tries=3 --timeout=120 >> /dev/null 2>&1
  ```
- **PHP versi**: cPanel → **MultiPHP Manager** → pastikan domain `bumi.<domainanda>` memakai **PHP 8.3** (Laravel 12 wajib 8.2+, dan beberapa dependensi butuh 8.3).
- **Batas unggah**: cPanel → **MultiPHP INI Editor** → domain → `upload_max_filesize` = `60M`, `post_max_size` = `60M` (untuk unggah karya/dokumen besar).

---

**Ringkas alur setelah semua tersetel:** edit kode → `git commit` → `git push origin main` → Actions deploy otomatis (±2 menit) → cek situs.

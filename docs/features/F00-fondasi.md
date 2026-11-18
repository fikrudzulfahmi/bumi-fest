# F00 — Fondasi Proyek  [Tahap 1 · Model: Opus]
**Tujuan:** kerangka yang konsisten agar fitur berikutnya cepat dan murah.
**Baca:** BLUEPRINT §2, §3, §4, §12, §14.

## Lingkup
- `laravel new bumifest` → pilih starter kit React, autentikasi bawaan Laravel, Pest. Git init.
- Konfigurasi: timezone `Asia/Jakarta`, locale `id`, terjemahan `laravel-lang/lang`, `Model::preventLazyLoading()` (non-produksi), queue `database`, disk `local`/`public`.
- Tooling: Pint, Larastan (level 6), script `composer qa` (pint --test, phpstan, pest) dan `npm run qa` (eslint, tsc, build).
- Semua Enum (BLUEPRINT §4) lengkap dengan `label()`/`color()`; `BusinessRuleViolation`.
- Kolom `role`, `preferred_level`, `is_active`, `whatsapp` pada users; middleware `role:*`; perintah `bumifest:make-admin`.
- Layout (Public, Portal, Admin, Judge) + komponen bersama §12 (cukup versi dasar yang bisa dipakai).
- `Settings` service, `.env.example` lengkap, `lib/format.ts`, token desain placeholder di `app.css`.
- Seeder dasar (admin dari env), README singkat (cara menjalankan, `composer qa`).

## Kriteria Penerimaan
- AC-F00-01 `composer qa` dan `npm run qa` hijau pada proyek kosong.
- AC-F00-02 `migrate:fresh --seed` sukses dan membuat admin dari env.
- AC-F00-03 Middleware `role`: peran salah → 403; guest → redirect login.
- AC-F00-04 Lazy loading melempar galat di test/local.
- AC-F00-05 `config('app.timezone')` = Asia/Jakarta; pesan validasi tampil Indonesia.
- AC-F00-06 `formatRupiah(150000)` → `Rp 150.000`; `Settings::get/set` bekerja dan cache bersih saat set.
- AC-F00-07 Layout tidak punya scroll horizontal di 375px (cek manual, catat di PROGRESS).

## Di luar lingkup
Fitur bisnis apa pun.

# Bumifest Web — Panduan Agen

Portal lomba Bumifest (SD/MI & SMP/MTs): pendaftaran, pembayaran manual, penjurian, sertifikat.
Teks UI = Bahasa Indonesia. Kode, nama kelas, kolom DB = Inggris.

## Stack
Laravel (stabil terbaru, PHP 8.3+) · Inertia 2 + React + TypeScript · Tailwind CSS 4 + shadcn/ui · Pest · Pint · Larastan ·
SQLite (dev/test), MySQL 8 (produksi) · Queue `database` · Timezone `Asia/Jakarta`, locale `id`.

## Cara kerja (WAJIB)
1. Satu sesi = satu fitur. Baca hanya: file ini → `docs/features/Fxx-*.md` → bagian `docs/BLUEPRINT.md` yang dirujuk spec
   (cari dengan `rg -n "^## " docs/BLUEPRINT.md`, jangan baca penuh) → `docs/PROGRESS.md`.
2. Tulis rencana ≤ 10 baris, lalu kerjakan. Tanya hanya bila terblokir. Hal yang belum jelas → pakai default di
   `docs/PRD.md` §6, catat asumsi di PROGRESS.
3. Test dulu: ubah tiap Kriteria Penerimaan (AC-Fxx-nn) jadi test Pest bernama `AC-Fxx-nn <deskripsi>`, lalu implementasi sampai hijau.
4. Pakai generator (`php artisan make:*`). CRUD meniru pola F03 (fitur referensi). Edit minimal; jangan tulis ulang file besar.
5. Sebelum selesai: `composer qa` dan `npm run qa` hijau + Definition of Done (BLUEPRINT §14) terpenuhi.
6. Commit `feat(Fxx): ringkasan`. Perbarui `docs/PROGRESS.md` (≤ 10 baris). Lapor ≤ 8 baris, lalu BERHENTI.
7. Error yang sama gagal 3 kali: berhenti, tulis hipotesis di PROGRESS, tanya.

## Hemat token
- Jangan buka `vendor/`, `node_modules/`, `storage/`, `public/build/`, lockfile, `.env`.
- Potong output: `php artisan test --compact --filter=AC-F05`, `cmd | tail -40`, `rg -n -m5 pola`.
- Iterasi dengan test terfokus; suite penuh sekali di akhir.
- Jangan membaca ulang file yang baru ditulis. Jangan menjelaskan kode panjang di laporan.
- Butuh dokumentasi Laravel/Inertia/Tailwind: pakai `search-docs` (Laravel Boost) bila ada; jika tidak, baca sumber di vendor secukupnya.

## Perintah
- `composer dev` server + queue + vite · `php artisan migrate:fresh --seed` data demo
- `composer qa` = pint --test + phpstan + pest · `npm run qa` = eslint + tsc + build
- `php artisan test --compact --filter=AC-Fxx`

## Konvensi
- Controller tipis. Validasi di FormRequest. Logika bisnis di `app/Actions/<Domain>/<VerbNoun>.php` (satu kelas, method `handle`,
  `DB::transaction`, melempar `BusinessRuleViolation` berpesan Indonesia). Otorisasi lewat Policy. Data ke Inertia lewat
  API Resource (jangan kirim model mentah).
- Status/tipe = PHP backed Enum di `app/Enums` dengan `label()` Indonesia. Transisi status HANYA lewat Action (BLUEPRINT §6).
- Uang = integer rupiah. Tanggal = Carbon (`Asia/Jakarta`); tampil `id-ID` lewat `resources/js/lib/format.ts`.
- Semua list: `paginate(15)`, eager load; `Model::preventLazyLoading()` aktif di non-produksi.
- Route name `area.resource.action` (mis. `admin.competitions.index`); URL publik berbahasa Indonesia.
- Frontend: `resources/js/pages/<area>/<Nama>.tsx`; komponen bersama di `components/app`; form pakai `useForm`;
  pakai komponen shadcn yang sudah ada sebelum membuat baru; mobile-first (375px, tanpa scroll horizontal, tombol ≥ 44px).
- Test: Pest feature test + factory; tiap fitur menguji otorisasi (peran boleh DAN terlarang).

## Keamanan (tidak boleh dilanggar)
- `role` tidak pernah dari input publik. Tiap rute punya middleware `auth`, `verified`, `role:*`; tiap akses data lewat Policy.
- Berkas privat di disk `local`, diunduh lewat controller berPolicy; nama file acak; validasi MIME asli & ukuran.
- Rate limit: login, unggah, verifikasi sertifikat. Jangan log data pribadi siswa.
- Perubahan uang/nilai/status: dalam transaksi DB dan tercatat (activity log, F13).

## Larangan
- Tambah paket di luar daftar BLUEPRINT §3 tanpa alasan tertulis di PROGRESS.
- Ubah migrasi fitur yang sudah selesai (buat migrasi baru).
- Mengerjakan hal di luar spec fitur (ide tambahan → PROGRESS bagian "Ide").
- Menyentuh secrets / `.env` produksi.

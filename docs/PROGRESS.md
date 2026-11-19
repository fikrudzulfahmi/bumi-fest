# PROGRESS (diperbarui agen di akhir tiap sesi, ≤ 10 baris per fitur)

| Fitur | Status | Commit | Catatan singkat |
|---|---|---|---|
| F00 Fondasi | ✅ | feat(F00): fondasi proyek | Laravel 12 + Inertia React, enum (Role, Level, Status, dll), middleware role:*, Settings service, seeder admin, prevent lazy loading, format utils. Build ✓, composer qa ✓, migrate:fresh --seed ✓. |
| F01 Akun & Auth | ✅ | feat(F01): akun dan autentikasi | RegisterRequest (normalize WhatsApp, privacy consent wajib), Institution model + migration, RegisterNewUser action (transaksi), LoginRequest (is_active check + pesan Indo), redirect per role. Register.tsx 2-tipe UI. AC-F01-01..10 test pass. composer qa + npm build ✓. |
| F02 Portal Jenjang | ✅ | feat(F02): portal jenjang & beranda | /portal (pilih SD/MI or SMP/MTs), /portal/{level} (daftar lomba published + status 4 tipe, pengumuman umum + level), preferred_level saved. Competition & Announcement model + factory, PortalController + routes middleware(auth,verified,role:participant,institution), Policy, Portal/.tsx UI (Index, Level). 8 AC-F02-01..08 test pass. composer qa + npm build ✓.
| F03 Admin Lomba (referensi CRUD) | ✅ | feat(F03): admin lomba, juknis, persyaratan | 6 Action (Store/Update/Delete/Publish/Archive/Duplicate), CompetitionController admin (index filter jenjang+status+cari, paginate 15), FormRequest validasi Indo (tanggal, tim, fee, PDF≤10MB), CompetitionResource, Policy 7 method admin-only, routes /admin/competitions + publish/archive/duplicate. Hapus ditolak bila ada pendaftaran (Schema::hasTable guard sampai F05). 15 AC-F03-01..10 test pass. composer qa + npm build ✓. |
| F04 Rekening, Pengaturan, Pengumuman | ✅ | feat(F04): admin rekening, pengaturan, pengumuman | BankAccount model + migration, CRUD (is_active, sort), ActiveBankAccount scope, FormRequest validasi Indo (regex nomor). Settings controller + Action (cache::forget + UpdateSettings transaksi). Announcement admin CRUD + publish/unpublish routes. 16 AC-F04 test pass (AC-01..06 rekening bank, AC-04..05 pengaturan & pengumuman). composer qa + npm build ✓. |
| F05 Siswa & Pendaftaran + Tagihan | ✅ | feat(F05): siswa, pendaftaran, tagihan | Migrasi 5 (participants, registrations, registration_members, registration_documents, invoices). Model Participant (levelForGrade BR-01), Registration (slotHolding), Invoice (BR-07 total=subtotal+kode unik 1–999), RegistrationMember/Document. Action: SaveRegistrationDraft, SubmitRegistration (lockForUpdate, BR-02..06, kuota), CancelRegistration (lepas slot), CreateInvoice (snapshot rekening + event), UploadRegistrationDocument (AC-07/08: jpg/png/pdf ≤5MB, finfo+magic-byte, disk privat), SwapRegistrationMember (BR-08: boleh sampai verified terkunci). Controller Participant + Registration + routes /siswa, /pendaftaran, /portal/{jenjang}/lomba/{slug}/daftar, upload & swap. 17 test AC-F05 hijau. composer qa + npm build ✓. |
| F06 Pendaftaran Kolektif | ☐ | | |
| F07 Pembayaran & Verifikasi | ☐ | | |
| F08 Notifikasi | ☐ | | |
| F09 Admin: Peserta, Dasbor, Ekspor | ☐ | | |
| F10 Juri & Rubrik | ☐ | | |
| F11 Penilaian, Peringkat, Hasil | ☐ | | |
| F12 Sertifikat | ☐ | | |
| F13 Pengerasan & Rilis | ☐ | | |

## Keputusan & asumsi
- Tailwind 4 + Tailwind CSS Vite plugin (bukan v3).
- Folder `resources/js/{Components,Layouts}` huruf besar (Breeze default).
- Enum cast di User model untuk type safety.
- F02: status dihitung per lomba (Dibuka|Segera dibuka|Ditutup|Kuota penuh) via computeStatus(now). Scope published/forLevel untuk query N+1-free. withoutVite() di test (bypass manifest build). Nullable quota=null → kuota unlimited. Match expression di Policy > enum comparison (PHPStan safe).
- F03: hapus lomba cek `DB::table('registrations')` + guard `Schema::hasTable` (tabel registrations baru ada di F05). PDF juknis di disk `public` (`competitions/rules/`, nama acak) — publik karena juknis memang untuk peserta. Duplikat = replicate() + slug `-salinan[-N]`, status draft, results_published_at null. Belum ada nested entries/scores untuk disalin, jadi seluruh kolom ikut tersalin.
- F03: `Edit.tsx` masih stub (menampilkan nama lomba) — form edit penuh dikerjakan bersama F05 saat field submission/dokumen benar-benar dipakai.

## Blokir / pertanyaan untuk manusia
(Tidak ada — siap lanjut Tahap 2, mulai F05)

## Ide di luar lingkup
(Tidak ada)

---
**Durasi Setup F00:** ~60 menit (dependency download 11 menit, setup+pint+phpstan 15 menit, rest coding).

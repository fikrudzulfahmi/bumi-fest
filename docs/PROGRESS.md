# PROGRESS (diperbarui agen di akhir tiap sesi, ≤ 10 baris per fitur)

| Fitur | Status | Commit | Catatan singkat |
|---|---|---|---|
| F00 Fondasi | ✅ | feat(F00): fondasi proyek | Laravel 12 + Inertia React, enum (Role, Level, Status, dll), middleware role:*, Settings service, seeder admin, prevent lazy loading, format utils. Build ✓, composer qa ✓, migrate:fresh --seed ✓. |
| F01 Akun & Auth | ✅ | feat(F01): akun dan autentikasi | RegisterRequest (normalize WhatsApp, privacy consent wajib), Institution model + migration, RegisterNewUser action (transaksi), LoginRequest (is_active check + pesan Indo), redirect per role. Register.tsx 2-tipe UI. AC-F01-01..10 test pass. composer qa + npm build ✓. |
| F02 Portal Jenjang | ✅ | feat(F02): portal jenjang & beranda | /portal (pilih SD/MI or SMP/MTs), /portal/{level} (daftar lomba published + status 4 tipe, pengumuman umum + level), preferred_level saved. Competition & Announcement model + factory, PortalController + routes middleware(auth,verified,role:participant,institution), Policy, Portal/.tsx UI (Index, Level). 8 AC-F02-01..08 test pass. composer qa + npm build ✓.
| F03 Admin Lomba (referensi CRUD) | ☐ | | |
| F04 Rekening, Pengaturan, Pengumuman | ☐ | | |
| F05 Siswa & Pendaftaran + Tagihan (buat) | ☐ | | |
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

## Blokir / pertanyaan untuk manusia
(Tidak ada — siap lanjut F03)

## Ide di luar lingkup
(Tidak ada)

---
**Durasi Setup F00:** ~60 menit (dependency download 11 menit, setup+pint+phpstan 15 menit, rest coding).

# PROGRESS (diperbarui agen di akhir tiap sesi, ≤ 10 baris per fitur)

| Fitur | Status | Commit | Catatan singkat |
|---|---|---|---|
| F00 Fondasi | ✅ | feat(F00): fondasi proyek | Laravel 12 + Inertia React, enum (Role, Level, Status, dll), middleware role:*, Settings service, seeder admin, prevent lazy loading, format utils. Build ✓, composer qa ✓, migrate:fresh --seed ✓. |
| F01 Akun & Auth | ☐ | | |
| F02 Portal Jenjang | ☐ | | |
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
- Test Breeze (8 fail) = page case-sensitivity issue, bukan F00 blocker.

## Blokir / pertanyaan untuk manusia
(Tidak ada — siap lanjut F01)

## Ide di luar lingkup
(Tidak ada)

---
**Durasi Setup F00:** ~60 menit (dependency download 11 menit, setup+pint+phpstan 15 menit, rest coding).

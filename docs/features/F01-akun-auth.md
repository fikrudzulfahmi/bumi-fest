# F01 — Akun & Autentikasi  [Tahap 1]
**Bergantung:** F00. **Baca:** PRD §2, BLUEPRINT §5 (users, institutions), §7.

## Lingkup
- Daftar dengan pilihan tipe `participant` | `institution`. Wajib: nama, email, WhatsApp, kata sandi (+konfirmasi), persetujuan privasi. Lembaga: nama sekolah, NPSN (8 digit, unik), kota. User + institution dibuat dalam satu transaksi.
- Verifikasi email, masuk, keluar, lupa/reset kata sandi, edit profil (nama, WA, kata sandi) — pakai bawaan starter kit, terjemahkan.
- WhatsApp dinormalisasi ke format `62…`.
- Redirect setelah masuk: admin → `/admin`, judge → `/juri`, lainnya → portal `preferred_level` atau `/portal`.
- Akun nonaktif (`is_active=false`) tidak bisa masuk. Throttle masuk 5/menit.
- Admin membuat akun lewat seeder/perintah; Juri lewat F10.

## Kriteria Penerimaan
- AC-F01-01 Daftar peserta berhasil, email verifikasi terkirim (Notification fake).
- AC-F01-02 Daftar lembaga membuat `institutions` terkait; NPSN tidak valid/ganda ditolak.
- AC-F01-03 Field `role` dari request diabaikan/ditolak (tidak bisa jadi admin/judge).
- AC-F01-04 Email belum terverifikasi → tidak bisa masuk `/portal` (diarahkan verifikasi).
- AC-F01-05 Redirect sesuai peran setelah masuk (empat peran).
- AC-F01-06 WhatsApp `0812-3456-7890` tersimpan `6281234567890`.
- AC-F01-07 Percobaan masuk ke-6 dalam semenit di-throttle.
- AC-F01-08 Akun nonaktif ditolak dengan pesan Indonesia.
- AC-F01-09 Lupa kata sandi: tautan reset terkirim dan berfungsi.
- AC-F01-10 Persetujuan privasi wajib; waktu persetujuan tersimpan.

## Di luar lingkup
Login sosial, 2FA.

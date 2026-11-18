# F13 — Catatan Aktivitas, Pengerasan, Uji Beban, Rilis  [Tahap 4]
**Bergantung:** semua. **Baca:** PRD §7, BLUEPRINT §15.

## Lingkup
- `spatie/laravel-activitylog` pada: tagihan (status), nilai/lembar, penetapan juara, penerbitan hasil, sertifikat, peran/aktif pengguna, pengaturan, rekening. Halaman `/admin/log` (filter pengguna, jenis, tanggal).
- Pengerasan: tinjau rate limit, header keamanan, `APP_DEBUG=false`, cek semua rute punya middleware + Policy (test yang memindai route list), halaman galat 403/404/419/500 berbahasa Indonesia.
- `spatie/laravel-backup` harian + panduan restore; `docs/DEPLOY.md` ringkas dari BLUEPRINT §15.
- Skrip uji beban `tests/load/*.js` (k6): beranda, login, daftar, unggah bukti; target PRD §7.
- Uji konkurensi kuota di MySQL (skrip terpisah, hasil dicatat).
- Aksesibilitas: lewati Lighthouse mobile ≥ 80 pada beranda dan halaman daftar.

## Kriteria Penerimaan
- AC-F13-01 Perubahan status tagihan, nilai, juara, pengaturan tercatat dengan pelaku dan waktu.
- AC-F13-02 Test pemindai rute: setiap rute non-publik punya `auth` dan (peran atau Policy).
- AC-F13-03 Halaman galat Indonesia tampil untuk 403/404/419/500.
- AC-F13-04 Backup berjalan dan arsip dapat dipulihkan (dicatat di PROGRESS).
- AC-F13-05 k6: p95 < 800 ms pada 500 VU untuk beranda dan daftar (dicatat di PROGRESS).
- AC-F13-06 Uji kuota MySQL: 50 Kirim paralel ke kuota 10 → tepat 10 berhasil.

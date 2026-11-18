# F02 — Portal Jenjang & Beranda  [Tahap 1]
**Bergantung:** F01 (+ lomba dari F03; gunakan factory selama F03 belum ada). **Baca:** PRD §3, BR-01, BR-02, BLUEPRINT §7.

## Lingkup
- Beranda publik `/`: nama/tema (dari settings), jadwal ringkas, tombol Daftar Akun/Masuk.
- `/portal`: pilih Portal SD/MI atau SMP/MTs. Pilihan disimpan ke `users.preferred_level`; bisa diganti lewat header.
- `/portal/{level}`: daftar lomba `published` jenjang itu (nama, kategori, biaya, tenggat, badge status), ringkasan entri milik pengguna, pengumuman (jenjang itu + umum).
- Status lomba terhitung: `Dibuka`, `Segera dibuka`, `Ditutup`, `Kuota penuh` (BR-02, BR-03).

## Kriteria Penerimaan
- AC-F02-01 `/portal` menampilkan dua pilihan jenjang.
- AC-F02-02 `{level}` tidak dikenal → 404.
- AC-F02-03 Hanya lomba `published` dengan level yang sama yang tampil.
- AC-F02-04 Empat status lomba dihitung benar (uji dengan waktu dibekukan).
- AC-F02-05 Pilihan jenjang tersimpan dan dipakai pada login berikutnya.
- AC-F02-06 Judge/admin mengakses `/portal` → 403.
- AC-F02-07 Pengumuman jenjang lain tidak tampil; pengumuman umum tampil di keduanya.
- AC-F02-08 Beranda memuat tanpa N+1 (jumlah query dibatasi di test).

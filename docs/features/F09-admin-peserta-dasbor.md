# F09 — Admin: Peserta, Lembaga, Dasbor, Ekspor  [Tahap 2]
**Bergantung:** F05–F07 (tiru pola F03). **Baca:** BLUEPRINT §5, §7.

## Lingkup
- `/admin` dasbor: pendaftar per lomba, total pembayaran masuk (Σ `total` tagihan `paid`, juga subtotal tanpa kode unik), jumlah menunggu verifikasi, tagihan hampir jatuh tempo.
- `/admin/pendaftaran`: daftar entri (filter jenjang, lomba, status, lembaga; cari nama/kode), detail, batalkan entri `verified` (alasan wajib, BR), koreksi nama siswa (BR-16).
- `/admin/lembaga`, `/admin/pengguna`: daftar, detail, aktif/nonaktifkan akun.
- Ekspor Excel: pendaftaran dan pembayaran (mengikuti filter aktif), job berantrean bila > 2.000 baris.

## Kriteria Penerimaan
- AC-F09-01 Angka dasbor cocok dengan data uji (fixture berisi berbagai status).
- AC-F09-02 Filter dan pencarian bekerja gabungan; paginasi 15; tanpa N+1.
- AC-F09-03 Ekspor mengikuti filter; kolom: kode, siswa, kelas, sekolah, lomba, status, tagihan.
- AC-F09-04 Batalkan entri verified tanpa alasan ditolak; dengan alasan: dibatalkan, slot lepas.
- AC-F09-05 Nonaktifkan akun mencegah login (cocok dengan AC-F01-08).
- AC-F09-06 Semua rute hanya untuk admin (403 untuk peran lain).

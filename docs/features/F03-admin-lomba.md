# F03 — Admin: Lomba, Juknis, Persyaratan  [Tahap 1 · Model: Opus — REFERENSI POLA CRUD]
Fitur ini menjadi contoh kode untuk semua CRUD berikutnya (controller, FormRequest, Resource, Policy, halaman Index/Form/Show, test). Kerjakan dengan teliti; sesi berikutnya akan meniru file-file ini.
**Baca:** PRD BR-02, BR-05, BR-06, BLUEPRINT §5 (competitions), §9, §12.

## Lingkup
- `/admin/lomba`: daftar (filter jenjang, status, cari nama), tambah, ubah, arsipkan, publikasikan, duplikat.
- Field: lihat skema `competitions`. Persyaratan = daftar teks berulang; dokumen wajib = pilihan `DocumentType`; mode karya `none|file|link` (+ jenis & ukuran bila `file`).
- Unggah juknis PDF (disk `public`, ≤ 10 MB); tampil sebagai tombol unduh.
- Halaman detail lomba untuk pengguna: `/portal/{level}/lomba/{slug}` memuat deskripsi, juknis, tabel persyaratan, biaya, kuota tersisa, tombol **Daftar** (aktif sesuai BR-02).

## Aturan
- `closes_at` > `opens_at`. Kategori `team` → `team_min` ≥ 2 dan `team_max` ≥ `team_min`.
- Kuota tidak boleh diubah di bawah jumlah entri penahan slot.
- Lomba dengan entri tidak bisa dihapus; hanya diarsipkan. `slug` unik, otomatis dari nama.
- Hanya admin boleh mengelola (Policy).

## Kriteria Penerimaan
- AC-F03-01 Admin membuat lomba valid; peran lain → 403.
- AC-F03-02 Validasi tanggal, tim (min/max), biaya ≥ 0 berpesan Indonesia.
- AC-F03-03 Juknis PDF valid tersimpan; non-PDF/ > 10 MB ditolak.
- AC-F03-04 Publikasi: lomba draft tidak tampil di portal; published tampil.
- AC-F03-05 Kuota < entri penahan slot ditolak saat ubah.
- AC-F03-06 Lomba berisi entri tidak bisa dihapus (diarsipkan).
- AC-F03-07 Halaman detail: tombol Daftar nonaktif di luar jadwal / kuota penuh, dengan alasan terbaca.
- AC-F03-08 Lomba beda jenjang dari `{level}` di URL → 404.
- AC-F03-09 Duplikat lomba menyalin pengaturan tanpa entri/nilai.
- AC-F03-10 Daftar admin terpaginasi 15, filter dan cari bekerja, tanpa N+1.

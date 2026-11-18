# F06 — Pendaftaran Kolektif Sekolah  [Tahap 2]
**Bergantung:** F05. **Baca:** PRD BR-03..BR-08, BLUEPRINT §8 (Import), `app/Actions/Registration/*` dari F05 (gunakan ulang, jangan duplikasi).

## Lingkup
- Hanya peran `institution`. `/portal/{level}/lomba/{slug}/daftar-kolektif`: dua cara menambah siswa: pilih dari daftar siswa sekolah, atau **unggah Excel/CSV** (template dapat diunduh: `nama_siswa`, `kelas`, `tim` — `tim` wajib untuk lomba tim, baris dengan `tim` sama jadi satu tim).
- **Impor dua langkah:** `PreviewCollectiveImport` memvalidasi (kolom kosong, nama ganda di file/di lomba, jenjang tidak cocok, ukuran tim, batas lomba per siswa, `import_max_rows`) dan menampilkan baris bermasalah; hasil valid disimpan di cache dengan token 30 menit. `CommitCollectiveImport` membuat siswa baru + entri; semua atau tidak sama sekali.
- Hasil: banyak entri → **satu tagihan** (`CreateInvoice` dengan banyak entri); kuota diperiksa untuk seluruh jumlah sekaligus.
- Dasbor sekolah `/pendaftaran`: semua siswa/entri beserta status; tambah siswa setelah tagihan ada → tagihan baru (BR-08); swap anggota sampai `closes_at`.

## Kriteria Penerimaan
- AC-F06-01 Peserta (non-lembaga) → 403 pada rute kolektif.
- AC-F06-02 Template unduh berisi kolom yang benar.
- AC-F06-03 Pratinjau menandai baris: kosong, ganda, kelas di luar jenjang, tim di luar min/max; tidak ada data tersimpan.
- AC-F06-04 Berkas > `import_max_rows` baris ditolak; format bukan xlsx/csv ditolak.
- AC-F06-05 Commit membuat siswa + entri sesuai baris; satu tagihan = jumlah entri × biaya + kode unik.
- AC-F06-06 Kuota kurang dari jumlah entri → seluruh commit ditolak (atomik), tak ada entri tersimpan.
- AC-F06-07 Token pratinjau kedaluwarsa/milik pengguna lain ditolak.
- AC-F06-08 Siswa yang sudah ada (nama+kelas sama) dipakai ulang, bukan digandakan.
- AC-F06-09 Menambah siswa setelah tagihan ada menghasilkan tagihan baru, tagihan lama tak berubah.
- AC-F06-10 Dasbor sekolah hanya menampilkan siswa/entri milik sekolah itu.

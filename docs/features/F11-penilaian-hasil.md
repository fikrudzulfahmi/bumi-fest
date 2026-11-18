# F11 — Penilaian, Peringkat, Juara, Penerbitan Hasil  [Tahap 3 · Model: Opus]
**Bergantung:** F10. **Baca:** PRD BR-10..BR-14, BLUEPRINT §5 (score_sheets, scores), §6, §8.

## Lingkup
- Juri `/juri/lomba/{id}`: daftar entri `verified` (kode, nama/tim, tautan/berkas karya lewat rute berPolicy), `/juri/penilaian/{registration}`: nilai per kriteria (0..max, 2 desimal), catatan; **Simpan Draf** dan **Kunci** (konfirmasi; semua kriteria wajib).
- Total lembar = Σ(nilai/max × bobot). Nilai akhir = rata-rata total semua juri ditugaskan, hanya bila semuanya `locked` (BR-12); pembulatan half-up 2 desimal.
- Admin `/admin/lomba/{id}/hasil`: tabel peringkat (nilai akhir, kelengkapan, penanda seri), buka kunci lembar (sebelum hasil terbit), **Tetapkan Juara** (saran top-3, seri boleh), **Terbitkan Hasil** (BR-13) → set `results_published_at`, dispatch pembuatan sertifikat (F12) dan event `ResultsPublished`.
- Portal jenjang menampilkan daftar juara setelah terbit (nama/tim, sekolah, juara ke).
- Props juri tidak boleh memuat data tagihan/pembayaran.

## Kriteria Penerimaan
- AC-F11-01 Juri hanya bisa membuka lomba yang ditugaskan (403 untuk lainnya); props tidak berisi data pembayaran.
- AC-F11-02 Hanya entri `verified` muncul.
- AC-F11-03 Nilai di luar 0..max ditolak; rubrik belum siap → penilaian ditutup dengan pesan.
- AC-F11-04 Simpan draf berulang; Kunci menolak bila ada kriteria kosong; setelah kunci juri tak bisa mengubah; total benar (contoh hitung manual di test).
- AC-F11-05 Admin membuka kunci → `draft`, total null; tidak bisa setelah hasil terbit.
- AC-F11-06 Tiga juri, dua terkunci → nilai akhir null ("belum lengkap"); ketiganya terkunci → rata-rata benar.
- AC-F11-07 Pembulatan 2 desimal half-up (mis. 84.125 → 84.13).
- AC-F11-08 Peringkat terurut, seri ditandai; `SetPlacements` menerima 1–3 (seri berbagi nilai peringkat), menolak peringkat di luar 1–3.
- AC-F11-09 Terbitkan diblokir bila ada entri verified tanpa nilai lengkap; dengan opsi "tanpa nilai lengkap" berhasil dan entri itu tidak berperingkat.
- AC-F11-10 Setelah terbit: `results_published_at` terisi, job sertifikat terdispatch, event `ResultsPublished`.
- AC-F11-11 Daftar juara tampil di portal hanya setelah terbit.
- AC-F11-12 Peran lain (peserta/lembaga) tidak bisa membuka rute juri/hasil (403).

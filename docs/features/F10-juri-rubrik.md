# F10 — Juri & Rubrik  [Tahap 3]
**Bergantung:** F03, F07. **Baca:** PRD §2, BR-11, BLUEPRINT §5 (judge_assignments, rubric_criteria).

## Lingkup
- `/admin/juri`: buat akun juri (nama, email, WA; `email_verified_at` langsung terisi), kirim tautan atur kata sandi (password broker), aktif/nonaktif, penugasan ke satu atau banyak lomba.
- `/admin/lomba/{id}/rubrik`: kriteria (nama, bobot, nilai maksimal, urutan); status "siap" bila total bobot = 100. Rubrik tidak bisa diubah setelah ada lembar nilai.
- `/juri`: dasbor lomba yang ditugaskan + progres (dinilai/terkunci dari total entri `verified`).

## Kriteria Penerimaan
- AC-F10-01 Admin membuat juri; email atur kata sandi terkirim; juri bisa masuk setelahnya.
- AC-F10-02 Pendaftaran umum tidak bisa membuat juri (cocok dengan AC-F01-03).
- AC-F10-03 Penugasan unik per pasangan juri–lomba; hapus penugasan boleh bila belum ada lembar nilai.
- AC-F10-04 Rubrik: bobot bulat ≥ 1, total ≠ 100 → status "belum siap" dengan pesan jelas.
- AC-F10-05 Rubrik terkunci setelah ada `score_sheets` untuk lomba itu.
- AC-F10-06 Dasbor juri hanya memuat lomba yang ditugaskan; progres akurat.
- AC-F10-07 Juri tidak bisa membuka rute `/admin/*` (403).

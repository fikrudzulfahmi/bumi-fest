# F07 — Pembayaran Manual & Verifikasi Admin  [Tahap 2 · Model: Opus]
**Bergantung:** F05. **Baca:** PRD BR-07..BR-09, BLUEPRINT §5 (invoices), §6, §8, §9.

## Lingkup
- `/tagihan` & `/tagihan/{id}` (pengguna): rekening (snapshot), total dengan kode unik disorot + tombol salin, jatuh tempo, daftar entri, unggah bukti (jpg/png/pdf ≤ 5 MB) → `awaiting_verification`.
- `/admin/pembayaran`: antrean (tertua dulu; filter status, jenjang, lomba; cari no. tagihan/nama/total), pratinjau bukti lewat rute berPolicy, **Terima** / **Tolak** (alasan wajib), perpanjang `due_at`.
- `invoices:expire` (scheduler tiap jam): `unpaid`/`rejected` lewat `due_at` → `expired`, entri `cancelled`, slot lepas.
- Dispatch event `ProofUploaded`, `InvoiceVerified`, `InvoiceRejected`, `InvoiceExpired` (listener di F08).

## Kriteria Penerimaan
- AC-F07-01 Detail tagihan memuat rekening snapshot, total = subtotal + kode unik, jatuh tempo, entri.
- AC-F07-02 Hanya pemilik dan admin yang bisa melihat tagihan/bukti; lainnya 403.
- AC-F07-03 Unggah bukti valid → tagihan dan entri `awaiting_verification`; event `ProofUploaded`.
- AC-F07-04 Unggah ditolak bila status `paid`, `expired`, `cancelled`, atau `awaiting_verification`.
- AC-F07-05 Antrean admin: filter, cari, urutan tertua dulu; pratinjau bukti lewat rute berotorisasi.
- AC-F07-06 Terima: tagihan `paid`, semua entri `verified`, `verified_by/at` tercatat, event terdispatch.
- AC-F07-07 Tolak tanpa alasan ditolak; dengan alasan: tagihan dan entri `rejected`, pengguna bisa unggah ulang.
- AC-F07-08 Dua admin memproses tagihan sama: yang kedua ditolak dengan pesan "sudah diproses".
- AC-F07-09 `invoices:expire`: hanya `unpaid`/`rejected` lewat jatuh tempo yang kedaluwarsa; `awaiting_verification`/`paid` tak tersentuh; slot lepas; terjadwal tiap jam.
- AC-F07-10 Juri dan peserta tidak bisa memverifikasi (403).
- AC-F07-11 Perpanjang `due_at` oleh admin menghidupkan kembali tagihan `unpaid`/`rejected`.

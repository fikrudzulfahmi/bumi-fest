# F05 — Siswa & Pendaftaran Individu/Tim + Pembuatan Tagihan  [Tahap 2 · Model: Opus]
Fitur paling berisiko (kuota, status, uang). Kerjakan dengan test dulu.
**Bergantung:** F02, F03, F04. **Baca:** PRD BR-01..BR-08, BLUEPRINT §5 (participants, registrations, registration_members, registration_documents, invoices), §6, §8, §9.
F05 memiliki `CreateInvoice`; unggah bukti, verifikasi, dan kedaluwarsa ada di F07. Dispatch event `InvoiceCreated` saja (listener di F08).

## Lingkup
- `/siswa`: CRUD siswa milik pengguna (nama, kelas 1–9, sekolah, kota). Jenjang otomatis dari kelas. Lembaga: sekolah terisi dari profil.
- `/portal/{level}/lomba/{slug}/daftar`: form individu (1 siswa) atau tim (nama tim + min..max siswa), unggah dokumen wajib per anggota, centang persetujuan persyaratan + juknis/privasi, karya (file/link bila lomba meminta).
- **Simpan draf** (tidak menahan slot) dan **Kirim** (`SubmitRegistration`): transaksi + `lockForUpdate` lomba → cek BR-02..BR-06 → snapshot `fee` → kode registrasi → `CreateInvoice` (kode unik, snapshot rekening aktif, `due_at`) → status `awaiting_payment`.
- `/pendaftaran` (daftar entri milik pengguna + status), `/pendaftaran/{id}` (detail, edit draf, batalkan, swap anggota BR-08).

## Kriteria Penerimaan
- AC-F05-01 Siswa: tambah/ubah/hapus milik sendiri; kelas menentukan jenjang; siswa dengan entri aktif tidak bisa dihapus.
- AC-F05-02 Siswa pengguna lain tidak bisa dilihat/diubah (403/404).
- AC-F05-03 Siswa dengan jenjang berbeda dari lomba ditolak.
- AC-F05-04 Kirim ditolak bila lomba belum buka/sudah tutup/draft/kuota penuh (pesan Indonesia).
- AC-F05-05 Individu tepat 1 siswa; tim: anggota dalam [min,max] dan nama tim wajib.
- AC-F05-06 Siswa sama tidak bisa dua kali di lomba sama; batas lomba per siswa (settings) dihormati.
- AC-F05-07 Dokumen wajib belum diunggah → Kirim ditolak, simpan draf tetap bisa.
- AC-F05-08 Berkas hanya jpg/png/pdf ≤ 5 MB; MIME palsu ditolak; nama file acak di disk privat.
- AC-F05-09 Kirim tanpa centang persetujuan ditolak.
- AC-F05-10 Kirim sukses: status `awaiting_payment`, `fee` tersnapshot, `code` unik, tagihan terbuat dengan total = fee + kode unik, event `InvoiceCreated` terdispatch.
- AC-F05-11 Tidak ada rekening aktif → Kirim gagal dengan pesan "hubungi panitia"; tidak ada slot tertahan.
- AC-F05-12 Slot terakhir: dua Kirim berurutan → satu berhasil, satu ditolak "kuota penuh" (transaksi + kunci dipakai).
- AC-F05-13 Batalkan (draft/awaiting_payment/rejected): status `cancelled`, slot lepas, anggota dilepas; tagihan `cancelled` bila tak ada entri lain.
- AC-F05-14 Entri `awaiting_verification`/`verified` tidak bisa diedit selain swap anggota (BR-08).
- AC-F05-15 Kode unik: 50 tagihan terbuka dengan subtotal sama menghasilkan total berbeda semua.

## Di luar lingkup
Impor kolektif (F06), unggah bukti (F07), email (F08).

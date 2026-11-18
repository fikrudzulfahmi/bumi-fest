# F04 — Admin: Rekening, Pengaturan, Pengumuman  [Tahap 1]
**Bergantung:** F03 (tiru polanya). **Baca:** BLUEPRINT §5 (bank_accounts, announcements, settings), §11.

## Lingkup
- `/admin/rekening`: CRUD rekening (bank, nomor, atas nama), aktif/nonaktif, urutan.
- `/admin/pengaturan`: `event_name`, `contact_whatsapp`, `contact_email`, `payment_due_hours` (1–720), `max_competitions_per_participant` (kosong = tanpa batas), `import_max_rows`.
- `/admin/pengumuman`: CRUD (judul, isi, jenjang atau umum, terbitkan/tarik).

## Kriteria Penerimaan
- AC-F04-01 Admin dapat CRUD rekening; peran lain 403.
- AC-F04-02 Hanya rekening aktif yang dipakai tagihan baru (`ActiveBankAccount` scope teruji).
- AC-F04-03 Nomor rekening hanya angka/tanda hubung, panjang wajar; validasi Indonesia.
- AC-F04-04 Pengaturan tersimpan dan cache bersih; nilai di luar rentang ditolak.
- AC-F04-05 Pengumuman terbit tampil di portal sesuai jenjang; draf tidak tampil.
- AC-F04-06 Menonaktifkan rekening tidak mengubah tagihan lama (snapshot).

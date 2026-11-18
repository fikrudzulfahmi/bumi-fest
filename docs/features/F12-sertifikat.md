# F12 — Sertifikat  [Tahap 4 · Model: Opus]
**Bergantung:** F11. **Baca:** PRD BR-14, BR-16, BLUEPRINT §5 (certificate_templates, certificates), §8, §9.

## Lingkup
- `/admin/lomba/{id}/sertifikat`: unggah template per jenis (`winner`, `participation`) — PNG/JPG ≤ 5 MB; atur `layout` JSON (posisi x,y dalam persen, ukuran font, warna, rata, font) untuk: nama, lomba, juara, nomor, QR; pratinjau PDF contoh.
- Pembuatan: `GenerateCertificateJob` per anggota entri `verified` (juara bila `placement` 1–3, partisipasi selain itu). Idempoten (`firstOrCreate` per registration+participant). dompdf, font TTF dari `resources/fonts`, QR (endroid) memuat URL verifikasi. Nama panjang: ukuran font mengecil sampai muat satu baris (batas minimum).
- Nomor: `BF{yy}-{LEVEL}-{KODELOMBA}-{urut 4 digit}`; `verification_code` acak 10 karakter (tanpa karakter ambigu).
- `/sertifikat`: daftar + unduh PDF (pemilik entri). Lembaga: **Unduh semua (ZIP)** dengan nama file aman.
- `/verifikasi/{kode}` publik: nama, lomba, jenis/juara, tanggal; tanpa data lain; throttle.
- Koreksi nama (admin) → regenerasi dengan nomor tetap. Event `CertificateReady`.

## Kriteria Penerimaan
- AC-F12-01 Template valid tersimpan; tipe/ukuran salah ditolak; pratinjau PDF terbuat.
- AC-F12-02 Terbitkan hasil membuat 1 sertifikat per anggota verified; juara vs partisipasi benar.
- AC-F12-03 Tanpa template: job gagal rapi, admin diberi tahu, bisa dijalankan ulang tanpa duplikat.
- AC-F12-04 Idempoten: menjalankan dua kali tidak menggandakan; nomor dan kode unik.
- AC-F12-05 Nama sangat panjang tetap muat satu baris; karakter beraksen tidak rusak.
- AC-F12-06 Pemilik entri bisa mengunduh; pengguna lain 403; guest diarahkan masuk.
- AC-F12-07 ZIP lembaga berisi semua sertifikat siswanya, nama file aman, tidak memuat milik sekolah lain.
- AC-F12-08 `/verifikasi/{kode}` valid menampilkan data minimal; kode salah → "tidak ditemukan"; throttle aktif.
- AC-F12-09 QR pada PDF mengarah ke URL verifikasi yang benar (decode di test atau cek payload).
- AC-F12-10 Koreksi nama → PDF baru, nomor sama.

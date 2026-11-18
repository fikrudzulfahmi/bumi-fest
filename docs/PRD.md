# PRD Aplikasi Web Perlombaan Bumifest

Versi 2.0 · 18 November 2026 · Stack: Laravel + Inertia (React) + Tailwind CSS

## 1. Ringkasan Produk

Bumifest Web adalah satu portal untuk pendaftaran, pembayaran, penjurian, dan sertifikat semua lomba Bumifest, jenjang SD/MI dan SMP/MTs.

**Masalah.** Pendaftaran lewat formulir, chat, dan transfer manual menyulitkan panitia memverifikasi peserta dan pembayaran. Sekolah yang mengirim banyak siswa harus mendaftar satu per satu. Sertifikat dibuat manual dan sering terlambat.

**Tujuan produk**

- Peserta atau sekolah mendaftar lomba online tanpa bantuan panitia.
- Satu sekolah mendaftarkan banyak siswa sekaligus (kolektif) dengan satu tagihan.
- Admin mengatur lomba, juknis, persyaratan, dan rekening sendiri tanpa programmer.
- Juri menilai lewat aplikasi; peringkat tersusun otomatis.
- Semua peserta terverifikasi menerima sertifikat digital yang bisa diverifikasi keasliannya.

**Target keberhasilan (sesuaikan dengan panitia)**

- 90% pendaftar selesai mendaftar tanpa bertanya ke panitia.
- Verifikasi pembayaran maksimal 1 x 24 jam.
- Sertifikat tersedia maksimal 3 hari setelah hasil diterbitkan (target sistem: otomatis, hitungan menit).

**Di luar cakupan v1:** aplikasi mobile native, payment gateway, streaming langsung, pengembalian dana otomatis, penilaian buta (blind judging).

## 2. Peran dan Akses

Satu akun = satu peran. Menu mengikuti peran.

| Peran | Siapa | Boleh |
|---|---|---|
| Peserta (`participant`) | Siswa/orang tua yang mendaftar sendiri | Kelola data siswa miliknya, daftar lomba, bayar, unggah karya, lihat hasil, unduh sertifikat |
| Lembaga (`institution`) | Guru/operator sekolah | Semua milik peserta + daftar kolektif, satu tagihan untuk banyak siswa, unduh semua sertifikat siswanya |
| Juri (`judge`) | Dewan juri dibuat Admin | Melihat lomba yang ditugaskan, menilai, mengunci nilai. Tidak melihat data pembayaran |
| Admin (`admin`) | Panitia (boleh banyak akun) | Semua pengaturan, verifikasi bayar, juri, juara, penerbitan hasil dan sertifikat |

Aturan akses:

- Pengguna hanya melihat data miliknya. Juri hanya lomba yang ditugaskan.
- Akun Juri dan Admin tidak bisa dibuat lewat pendaftaran umum.
- Hak akses diperiksa di server (Policy), bukan hanya disembunyikan di tampilan.

## 3. Alur Pengguna

1. Pengunjung membuka beranda publik (tema, jadwal, tombol Daftar Akun / Masuk).
2. Daftar akun (Peserta atau Lembaga) → verifikasi email → masuk.
3. Pilih **Portal SD/MI** atau **Portal SMP/MTs** (pilihan diingat untuk login berikutnya, bisa diganti).
4. Pilih lomba (hanya lomba jenjang itu) → baca juknis dan persyaratan.
5. Daftar sendiri (individu/tim) atau kolektif (Lembaga). Simpan draf, lengkapi dokumen, centang persetujuan, **Kirim**.
6. Sistem menahan kuota dan membuat tagihan (nominal + kode unik 3 digit).
7. Pengguna transfer dan unggah bukti bayar.
8. Admin memeriksa bukti: **Terima** → terverifikasi; **Tolak** (alasan) → pengguna unggah ulang (kembali ke 7).
9. Juri menilai entri terverifikasi sesuai rubrik dan mengunci nilai.
10. Admin menetapkan juara dan **Terbitkan Hasil** → pengumuman di portal + sertifikat dibuat otomatis.
11. Peserta/sekolah mengunduh sertifikat; siapa pun dapat memverifikasi keaslian lewat kode QR.

## 4. Fitur dan Prioritas

Urutan pengerjaan = urutan di tabel. Detail tiap fitur ada di `docs/features/`.

| ID | Fitur | Prioritas | Tahap |
|---|---|---|---|
| F00 | Fondasi proyek (tooling, layout, komponen, peran) | P1 | 1 |
| F01 | Akun & autentikasi | P1 | 1 |
| F02 | Portal jenjang & beranda | P1 | 1 |
| F03 | Admin: lomba, juknis, persyaratan (pola CRUD referensi) | P1 | 1 |
| F04 | Admin: rekening, pengaturan, pengumuman | P1 | 1 |
| F05 | Siswa & pendaftaran individu/tim + pembuatan tagihan | P1 | 2 |
| F06 | Pendaftaran kolektif sekolah (impor Excel/CSV) | P1 | 2 |
| F07 | Pembayaran manual & verifikasi admin | P1 | 2 |
| F08 | Notifikasi email (+ antarmuka WhatsApp) | P1 (WA = P2) | 2 |
| F09 | Admin: peserta, lembaga, dasbor, ekspor Excel | P1 | 2 |
| F10 | Juri & rubrik | P1 | 3 |
| F11 | Penilaian, peringkat, juara, penerbitan hasil | P1 | 3 |
| F12 | Sertifikat PDF, unduh massal, verifikasi QR | P1 (QR = P2) | 4 |
| F13 | Catatan aktivitas, pengerasan, uji beban, rilis | P2 | 4 |

## 5. Aturan Bisnis

| ID | Aturan |
|---|---|
| BR-01 | Jenjang ditentukan kelas: 1–6 = SD/MI, 7–9 = SMP/MTs. Portal, lomba, dan siswa harus satu jenjang; selain itu ditolak. |
| BR-02 | Pendaftaran dibuka bila lomba `published`, waktu sekarang di antara `opens_at` dan `closes_at`, dan kuota masih ada. |
| BR-03 | Kuota dihitung per entri (individu = 1 siswa, tim = 1 tim). Slot ditahan sejak **Kirim** (status `awaiting_payment`, `awaiting_verification`, `verified`, `rejected`) dan dilepas saat `cancelled`. Draf tidak menahan slot. |
| BR-04 | Satu siswa maksimal satu entri aktif per lomba. Batas jumlah lomba per siswa mengikuti pengaturan (default tanpa batas). |
| BR-05 | Tim: jumlah anggota antara `team_min` dan `team_max`, nama tim wajib, semua anggota satu jenjang dengan lomba. |
| BR-06 | Biaya per entri (individu: per siswa; tim: per tim), disalin ke entri saat Kirim (snapshot). |
| BR-07 | Tagihan: total = jumlah biaya entri + kode unik 1–999. Tidak ada dua tagihan terbuka dengan total sama. Jatuh tempo default 48 jam. Lewat jatuh tempo tanpa bukti valid: tagihan `expired`, entri `cancelled`, slot bebas. |
| BR-08 | Tagihan tidak berubah setelah bukti diunggah. Menambah siswa setelah tagihan ada → tagihan baru. Mengganti anggota (swap) boleh sebelum `closes_at` dan sebelum ada nilai terkunci, tanpa mengubah biaya. |
| BR-09 | Verifikasi hanya dari status `awaiting_verification`. Tolak wajib beralasan; pengguna boleh unggah ulang sampai jatuh tempo. Admin kedua yang membuka tagihan yang sudah diproses ditolak sistem. |
| BR-10 | Hanya entri `verified` yang dinilai dan mendapat sertifikat. |
| BR-11 | Total bobot rubrik = 100. Nilai per kriteria 0..`max_score`. Lembar nilai terkunci tidak bisa diubah juri; hanya Admin yang bisa membuka (selama hasil belum terbit). |
| BR-12 | Total lembar = Σ (nilai / max × bobot). Nilai akhir = rata-rata total semua juri yang ditugaskan; dihitung hanya bila semua lembar terkunci. Pembulatan 2 desimal. Peringkat urut nilai akhir; seri ditandai; Admin menetapkan juara 1–3 (seri boleh berbagi peringkat). |
| BR-13 | Hasil per lomba diterbitkan Admin. Diblokir bila ada entri `verified` tanpa nilai lengkap, kecuali Admin memilih "terbitkan tanpa nilai lengkap" (entri itu hanya mendapat Partisipasi). Setelah terbit, nilai tidak bisa dibuka lagi. |
| BR-14 | Sertifikat satu per anggota entri `verified`: Juara (juara 1–3) atau Partisipasi. Nomor unik, kode verifikasi acak, pembuatan idempoten. |
| BR-15 | Data siswa minimal: nama, kelas, sekolah. Persetujuan privasi dan juknis dicatat waktunya. |
| BR-16 | Setelah hasil terbit hanya Admin yang boleh mengoreksi nama; sertifikat dibuat ulang dengan nomor sama. |

## 6. Keputusan Default (menggantikan "Pertanyaan Terbuka")

Agen membangun memakai default ini dan tidak menunggu jawaban panitia. Semua dapat diubah lewat panel admin kecuali dicatat lain.

| Topik | Default v1 | Diubah di |
|---|---|---|
| Daftar lomba & biaya | Data contoh lewat seeder; Admin mengisi sendiri | Panel admin |
| Individu atau tim | Pilihan per lomba (`category`) | Pengaturan lomba |
| Pengumpulan karya | Tidak ada (`none`); per lomba bisa `file` atau `link` | Pengaturan lomba |
| Tim lintas sekolah | Boleh; sekolah diisi per anggota | — |
| Diskon kolektif | Tidak ada di v1 (kolom `discount` disiapkan) | P2 |
| Pengembalian dana | Di luar sistem; Admin membatalkan entri dan mencatat manual | — |
| Tanda tangan sertifikat | Menjadi bagian gambar template | Template sertifikat |
| Jatuh tempo bayar | 48 jam | Pengaturan |
| Batas lomba per siswa | Tanpa batas | Pengaturan |
| Ukuran berkas | Dokumen/bukti 5 MB (JPG, PNG, PDF); karya file 50 MB | Pengaturan lomba |
| WhatsApp | Antarmuka + driver `log`; penyedia dipilih nanti | P2 |
| Kapasitas | 500 pengguna aktif serentak, 3.000 pendaftaran | Uji beban F13 |
| Tanggal buka/tutup/hari lomba/pengumuman | Diisi per lomba | Panel admin |

**Masih perlu dari panitia (tidak memblokir coding):** logo, warna merek, nama dan daftar lomba final, teks kebijakan privasi, desain template sertifikat.

## 7. Non-Fungsional (terukur)

- **Kinerja:** beranda LCP < 3 detik di 4G (Lighthouse mobile ≥ 80); respons server p95 < 800 ms pada 500 pengguna serentak (k6, F13); JS halaman awal ≤ 200 KB gzip (code-splitting per halaman).
- **Mobile-first:** nyaman di HP 375px dan RAM kecil; tombol ≥ 44px; tabel berubah jadi kartu di layar kecil.
- **Aksesibilitas:** kontras AA, semua input berlabel, galat form dibacakan (aria).
- **Keamanan:** HTTPS, hash kata sandi, Policy di server, validasi MIME asli, nama file acak, rate limit, tanpa data siswa di halaman publik selain verifikasi sertifikat.
- **Privasi (UU PDP):** data minimal, persetujuan tercatat, kebijakan privasi ditampilkan saat daftar.
- **Keandalan:** backup database harian, uji restore sekali sebelum rilis; antrean job dengan retry 3x.
- **Bahasa:** sepenuhnya Indonesia, kalimat sederhana untuk guru dan orang tua.

## 8. Rencana Rilis

Estimasi satu tim kecil / satu agen dengan peninjauan manusia per fitur.

| Tahap | Isi | Perkiraan |
|---|---|---|
| 1 Fondasi | F00–F04 | ± 3 minggu |
| 2 Pendaftaran & pembayaran | F05–F09 → **pendaftaran bisa dibuka untuk umum** | ± 3 minggu |
| 3 Penjurian | F10–F11 | ± 2 minggu |
| 4 Sertifikat & rilis | F12–F13 | ± 2 minggu |

## 9. Risiko

| Risiko | Dampak | Penanganan |
|---|---|---|
| Bukti bayar menumpuk | Peserta cemas, panitia kewalahan | Kode unik, antrean berfilter, banyak akun admin |
| Data kolektif salah | Sertifikat salah nama | Impor dua langkah (pratinjau galat), swap anggota sampai tenggat |
| Kuota jebol saat banyak kirim bersamaan | Entri melebihi kuota | Kunci baris lomba (`lockForUpdate`) dalam transaksi |
| Lonjakan hari terakhir | Situs lambat | Uji beban, antrean job, cache daftar lomba, perpanjang tenggat |
| Batas unggah server lebih kecil dari batas aplikasi | Unggah gagal diam-diam | Atur `upload_max_filesize`, `post_max_size`, `client_max_body_size` (BLUEPRINT §15) |
| Nama panjang merusak sertifikat | Sertifikat cacat | Ukuran font menyesuaikan, pratinjau template |
| Kebocoran data siswa | Pelanggaran privasi anak | Policy, HTTPS, data minimal, berkas privat |
| Agen melebar dari spec / boros token | Biaya naik, hasil tak konsisten | AGENTS.md, spec per fitur, sesi per fitur (PLAYBOOK) |

## 10. Perubahan dari PRD Lama

- Stack diganti ke Laravel + Inertia (React) + Tailwind; Next.js dihapus.
- Ditambahkan entitas yang hilang: **registration_members** (tim), **registration_documents**, **score_sheets**, **certificate_templates**, **announcements**, **settings**.
- Pendaftaran kini berupa entri (individu/tim) berisi anggota; kolektif = banyak entri, satu tagihan.
- Aturan tersirat dijadikan BR-01..BR-16 (kuota, kode unik, tagihan terkunci, seri nilai, hasil tanpa nilai lengkap).
- Pertanyaan terbuka diganti keputusan default agar pembangunan tidak tertahan.
- Target non-fungsional dibuat terukur; ditambah batas unggah server, pengerasan, dan uji beban.
- Pekerjaan dipecah jadi F00–F13 dengan Kriteria Penerimaan yang dapat langsung dijadikan test.

# Blueprint Desain — Bumifest

> Untuk agen pembangun (Hermes) · Stack: Laravel + Inertia (React) + Tailwind CSS v4
> Pratinjau visual: `index.html` (sumber kebenaran tampilan; ekstrak blok `<style>` menjadi `resources/css/bumifest.css`).
> PRD menang untuk fungsi; dokumen ini menang untuk visual.

## 0. Aturan kerja (hemat token)
1. Satu modul per sesi (urutan §7). Baca hanya bab PRD modul itu + bagian relevan dokumen ini.
2. Jangan menulis CSS dari nol: pakai kelas/token dari `bumifest.css` (hasil ekstrak `index.html`). Komponen baru hanya bila padanannya tidak ada, dan wajib memakai token.
3. Tidak ada hex/ukuran baru di komponen; semuanya lewat `var(--…)`.
4. Selesai modul → jalankan checklist §8 → laporkan butir yang gagal. Jangan menyentuh modul lain.

## 1. Identitas: "Bumi Clay" (berbeda dari FPM)
Hangat, membumi, bergaya cetak/poster. Bukan dashboard generik.

| Aspek | Bumifest |
|---|---|
| Warna | Tanah liat `--clay` + kunyit `--saffron` + pasir `--sand`, aksen lumut `--moss`, tinta cokelat `--ink` |
| Huruf | **Fraunces** (serif display, judul, angka besar, miring untuk penekanan) + **DM Sans** (isi, label) |
| Bentuk | Kotak membulat (12–14px), **border 2px tinta**, **bayangan keras** `4px 4px 0` (tanpa blur) |
| Interaksi | Hover: kartu naik-kiri, tombol menekan ke bawah-kanan (bayangan mengecil) |
| Signature | Kolase bentuk geometris di hero (lengkung tanah liat, matahari, daun), pita berjalan nama lomba, kartu bento berwarna, angka besar serif, footer dengan kata "bumifest" outline raksasa |
| Latar | Pasir dengan pola garis kontur halus (repeating radial gradient); section gelap = tinta |

## 2. Token (blok `:root`)
```
--clay #b4431f   --clay-d #8a3016   --saffron #f4b942
--sand #f6eddf   --sand-2 #ecdfca   --paper #fffaf2
--ink #2a1b14    --ink-2 #5a4538    --moss #4b6a3d
--D "Fraunces", Georgia, serif      --B "DM Sans", system-ui, sans-serif
--r 14px   --hard 4px 4px 0 var(--ink)   --w 1180px   --pad clamp(20px,5vw,44px)
```
Status: menunggu = `--saffron`, disetujui = `--moss`, ditolak/error = `--clay-d` atau `#a03030`, netral/penuh = tinta transparan (coret judul bila kuota penuh).
Skala judul: h1 `clamp(2.9rem,8vw,6rem)` · h2 `clamp(2.1rem,4.6vw,3.6rem)` · h3 ±1.5–1.7rem; Fraunces 800, `letter-spacing:-.02em`, `text-wrap:balance`. Label kecil: DM Sans 700, 12–13px, huruf kapital, `letter-spacing .1–.14em`.

## 3. Komponen (nama kelas di `index.html`)
`.bar` header sticky bergaris bawah · `.logo` (bulatan tanah-matahari) · `.nav` + `.burger` · `.btn` (`--clay`, `--ghost`, `--sm`) · `.tag` · `.hero` + `.collage` · `.tick` (pita berjalan) · `.stats` · `.sec` + `.kicker` + `.sub` · `.bento` + `.k` (`--clay`, `--saf`, `--moss`, `--ink`) + `.meta` + `.pill` · `.steps/.step` (nomor otomatis CSS counter, border putus-putus) · `.dark` + `.flow` (alur bernomor) · `.faq` (details + ikon plus) · `.cta` · `footer` + `.big`.

Perlu dibuat (ikuti gaya yang sama: border 2px tinta, radius `--r`, bayangan keras, token saja): form & input (fokus = outline `--saffron`), tabel/data-table, badge status, modal, toast, dialog konfirmasi, paginasi, sidebar area login, kartu statistik. Area login memakai latar `--sand`, panel `--paper` bergaris tinta, **tanpa** gradien dekoratif berlebih; kepadatan lebih tinggi dari publik.

## 4. Halaman
**Publik:** Landing (hero+kolase → pita → stats → bento lomba → jadwal → alur gelap → FAQ → CTA → footer), Daftar cabang, Detail cabang, Hasil, Login/Daftar akun.
**Area login (peserta & panitia):** sesuaikan dengan modul di PRD (dashboard, pendaftaran, penilaian, hasil, sertifikat, pengguna, pengaturan event).
Latar section publik berselang: sand → sand → gelap (alur) → sand → clay (CTA). Hindari dua blok gelap bersebelahan.

## 5. Aturan visual
**Lakukan:** satu CTA saffron/clay per area pandang; judul kalimat utuh yang hangat; angka & kode pakai Fraunces atau `tabular-nums`; setiap daftar/tabel/form punya state kosong, loading, error per-field, sukses; aksi destruktif lewat dialog konfirmasi.
**Hindari:** blur shadow lembut ala template (pakai bayangan keras), gradien ungu/biru, radius campur-aduk, border tipis 1px abu, emoji sebagai ikon utama, lebih dari satu aksen di luar saffron/moss, animasi besar.

## 6. Perilaku & aksesibilitas
Menu mobile ≤ 900px (toggle `aria-expanded`, tutup saat tautan diklik); `scroll-padding-top` = tinggi header; `:focus-visible` outline saffron 3px; target sentuh ≥ 44px; kontras teks cukup (krem di atas clay/tinta, tinta di atas saffron/sand); `prefers-reduced-motion` mematikan animasi (pita berjalan, entrance); tabel mobile → kartu dengan `data-label`; Bahasa Indonesia ramah-formal.

## 7. Urutan modul
1 Fondasi (`bumifest.css`, `app.css`, font, `app.blade.php`) → 2 `GuestLayout` → 3 Landing → 4 Komponen bersama (Field, Modal, Toast, Confirm, StatusBadge, DataTable, Pagination) → 5 Auth → 6 `AppLayout` → 7 Modul peserta → 8 Modul panitia → 9 Halaman publik lain → 10 Poles.

Template prompt: *"Kerjakan modul {nama} sesuai PRD bab {x} dan BLUEPRINT-DESIGN-BUMIFEST §{y}. Pakai kelas & token yang ada. Jangan sentuh modul lain. Setelah selesai, jalankan checklist §8."*

## 8. Checklist penerimaan
- [ ] Hanya token/kelas dari dokumen ini; tidak ada hex baru.
- [ ] Judul Fraunces, isi DM Sans; border 2px tinta + bayangan keras konsisten.
- [ ] Responsif 360 / 768 / 1280 tanpa scroll horizontal.
- [ ] Fokus keyboard terlihat; nav punya `aria-current`; ada skip-link.
- [ ] State kosong, loading, error, sukses tersedia.
- [ ] Status memakai badge standar; aksi destruktif memakai konfirmasi.
- [ ] Reduced-motion dihormati.

## 9. Perlu Anda sediakan / putuskan
Logo resmi Bumifest · tanggal, lokasi, daftar cabang, hadiah, FAQ asli · foto dokumentasi · warna brand sendiri bila ada (ganti hanya token §2) · kontak panitia. Pratinjau memakai logo bulatan sementara dan data contoh.

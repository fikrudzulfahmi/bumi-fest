# Playbook Hermes (Claude Opus): Efektif, Hemat Token, Hasil Rapi

## 1. Prinsip
1. **Konteks berlapis.** L0 `AGENTS.md` (selalu dimuat, singkat) → L1 spec fitur (per tugas) → L2 bagian BLUEPRINT (dicari dengan `rg`) → L3 kode. Jangan pernah memuat semuanya sekaligus.
2. **Satu sesi = satu fitur.** Sesi baru per fitur menjaga konteks kecil; ingatan antar-sesi ada di `docs/PROGRESS.md` dan git.
3. **Spec yang bisa diuji.** Tiap AC menjadi test; "selesai" berarti test hijau, bukan "sepertinya benar".
4. **Pola pertama jadi cetakan.** F03 dikerjakan teliti, lalu CRUD lain meniru file-nya, bukan menciptakan ulang.
5. **Putus loop mahal.** Error sama gagal 3× → berhenti dan tulis hipotesis.
6. **Jaga `AGENTS.md` stabil.** Awalan konteks yang tidak berubah biasanya lebih murah (cache prompt). Ubah di antara sesi, bukan di tengah sesi.

## 2. Alur Kerja
```
Fase 0  Manusia menaruh AGENTS.md + docs/ di folder kosong → sesi F00
Tiap fitur  sesi baru → prompt master → agen: rencana → test AC → kode → qa → commit → PROGRESS → berhenti
Manusia  tinjau 5–10 menit (§5) → setujui / minta perbaikan di sesi yang sama → lanjut fitur berikut
Tiap akhir tahap  sesi khusus "review diff" + seed demo diuji manual
```

## 3. Prompt Master (salin, ganti Fxx)
```
Kerjakan F05 sesuai docs/features/F05-*.md. Ikuti AGENTS.md.
Baca hanya: spec itu, bagian BLUEPRINT yang dirujuk, docs/PROGRESS.md.
Urutan: rencana ≤10 baris → test AC-F05-* → implementasi → composer qa && npm run qa → commit → update PROGRESS → lapor ≤8 baris → berhenti.
Jangan mengerjakan di luar spec. Asumsi baru → catat di PROGRESS.
```

**Prompt Fase 0 (F00):**
```
Folder ini berisi AGENTS.md dan docs/. Kerjakan docs/features/F00-fondasi.md mulai dari `laravel new bumifest`
(React starter kit, autentikasi bawaan Laravel, Pest) lalu pindahkan AGENTS.md dan docs/ ke dalam proyek.
Ikuti prompt master. Pilih versi terbaru yang stabil; jangan menurunkan versi.
```

**Prompt perbaikan (sesi sama):** `AC-F05-12 gagal di tinjauan saya: <gejala>. Perbaiki dengan test yang mereproduksinya lebih dulu.`
**Prompt review diff (akhir tahap):** `Tinjau hanya git diff <tag-tahap-sebelumnya>..HEAD terhadap docs/BLUEPRINT.md §14 dan AGENTS.md bagian Keamanan. Daftar temuan berprioritas, jangan ubah kode.`

## 4. Hemat Token (praktis)
- Perintah dengan output dibatasi: `--compact`, `| tail -40`, `rg -n -m5`. Jangan `cat` file besar; baca rentang baris.
- Test terfokus saat iterasi (`--filter=AC-F05`), suite penuh sekali di akhir.
- Generator artisan untuk model/migrasi/factory/policy/request; hindari menulis boilerplate manual.
- Laporan agen pendek; penjelasan panjang tidak diminta.
- Review diff, bukan seluruh repo.
- **Routing model (bila Hermes mendukung ganti model per tugas):** Opus untuk F00, F03, F05, F07, F11, F12 (arsitektur, status, uang, nilai, PDF); model lebih murah untuk CRUD turunan (F04, F09, F10), penyempurnaan UI, terjemahan, dan menambah test.
- Jangan minta agen "memeriksa seluruh proyek" atau "menulis dokumentasi lengkap".

## 5. Tinjauan Manusia per Fitur (5–10 menit)
1. `php artisan migrate:fresh --seed` lalu `composer dev`; buka alur fitur di HP/lebar 375px.
2. Uji jalur gagal: input salah, peran salah, tenggat lewat.
3. `composer qa && npm run qa` hijau; baca `git diff --stat` (tidak ada file di luar lingkup).
4. Cek teks Indonesia, tidak ada kata Inggris tersisa.
5. Centang fitur di `docs/PROGRESS.md`; beri tag git `fxx-done`.

## 6. Bila Agen Melenceng
| Gejala | Tindakan |
|---|---|
| Menambah paket/fitur di luar spec | Revert, ingatkan AGENTS.md "Larangan", sesi baru |
| Membaca file raksasa / output panjang | Ingatkan bagian "Hemat token"; batasi dengan `tail`/`-m` |
| Test dilemahkan agar lolos | Tolak; test AC tidak boleh diubah kecuali spec salah (catat di PROGRESS) |
| Mengubah migrasi lama | Revert; buat migrasi baru |
| Konteks terasa penuh / jawaban melantur | Simpan kondisi di PROGRESS, mulai sesi baru |

## 7. Setelah Rilis Pertama
Perubahan spec: ubah dulu `docs/PRD.md`/spec fitur (sumber kebenaran), baru minta agen menerapkan. Fitur baru = file `docs/features/F14-*.md` dengan format sama (Tujuan, Baca, Lingkup, AC, Di luar lingkup).

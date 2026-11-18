# Blueprint Teknis Bumifest Web

Dibaca per bagian (`rg -n "^## " docs/BLUEPRINT.md`). Aturan bisnis ada di `docs/PRD.md` §5 (BR-xx).

## 1. Arsitektur

```
Browser (Inertia + React)
  → Route → Middleware (auth, verified, role) → Controller (tipis)
  → FormRequest (validasi) → Policy (otorisasi)
  → Action (logika bisnis, transaksi DB) → Model / DB
  → Resource (data ke halaman) → Inertia page

Event → Listener (queued) → Mail / WhatsappGateway
Job: sertifikat PDF, ZIP, ekspor
Scheduler: invoices:expire (tiap jam)
Storage: disk local (privat), public (juknis)
```

## 2. Struktur Folder

```
app/Enums/                  Role, Level, CompetitionCategory, CompetitionStatus,
                            RegistrationStatus, InvoiceStatus, DocumentType,
                            SubmissionMode, ScoreSheetStatus, CertificateType
app/Models/   app/Policies/
app/Http/Controllers/{Admin,Judge,Portal,Public}/
app/Http/{Requests,Resources,Middleware}/
app/Actions/{Registration,Invoice,Scoring,Certificate,Import}/
app/Exceptions/BusinessRuleViolation.php
app/Events/   app/Listeners/   app/Notifications/   app/Jobs/
app/Services/{Settings,Whatsapp,Certificate}/
app/Imports/  app/Exports/
resources/js/pages/{public,auth,portal,admin,judge}/
resources/js/{components/{ui,app},layouts,lib,types}/
resources/fonts/   lang/id/   tests/Feature/<Area>/   tests/load/
database/{migrations,factories,seeders}/
```

## 3. Paket (daftar putih)

Backend: starter kit React (Inertia, auth bawaan, shadcn/ui), `pestphp/pest` + plugin Laravel, `larastan/larastan`,
`laravel/pint`, `laravel-lang/lang` (terjemahan `id`), `maatwebsite/excel`, `barryvdh/laravel-dompdf`,
`endroid/qr-code`, `spatie/laravel-activitylog` (F13), `spatie/laravel-backup` (F13), `laravel/boost` (dev, opsional).
Frontend: `lucide-react`, komponen shadcn. Paket lain butuh alasan tertulis di PROGRESS.

## 4. Enum

| Enum | Nilai |
|---|---|
| Role | participant, institution, judge, admin |
| Level | sd_mi (slug `sd-mi`, kelas 1–6), smp_mts (slug `smp-mts`, kelas 7–9) |
| CompetitionCategory | individual, team |
| CompetitionStatus | draft, published, archived |
| SubmissionMode | none, file, link |
| DocumentType | student_card, school_letter, other |
| RegistrationStatus | draft, awaiting_payment, awaiting_verification, verified, rejected, cancelled |
| InvoiceStatus | unpaid, awaiting_verification, rejected, paid, expired, cancelled |
| ScoreSheetStatus | draft, locked |
| CertificateType | winner, participation |

Tiap enum punya `label()` Indonesia (dan `color()` untuk badge). Slug jenjang dipakai di URL lewat route binding.

## 5. Skema Database

`*` = unik, `?` = nullable. Semua tabel punya `id`, `timestamps` kecuali dicatat. Hindari kata terpesan MySQL (`rank` → `placement`).

- **users**: name, email*, whatsapp, password, role, preferred_level?, is_active=true, email_verified_at?
- **institutions**: user_id* (FK), name, npsn* (8 digit), city
- **participants** (siswa): owner_id (FK users), institution_id?, name, grade (1–9), level, school_name, school_city?; index(owner_id, name, grade)
- **competitions**: level, name, slug*, description, category, fee (uint rupiah), quota?, team_min?, team_max?, opens_at, closes_at, status, rules_pdf_path?, requirements (json list teks), required_documents (json list DocumentType), submission_mode, submission_mimes? (json), submission_max_mb?, results_published_at?
- **registrations**: code* (mis. `BF26-SD-00001`), competition_id, owner_id, invoice_id?, status, team_name?, fee (snapshot), submission_path?, submission_url?, submission_name?, requirements_accepted_at?, consented_at?, submitted_at?, final_score? (decimal 5,2), placement? (tinyint); index(competition_id, status)
- **registration_members**: registration_id, participant_id, competition_id (denormalisasi), position; unique(competition_id, participant_id). Membatalkan entri menghapus baris anggotanya.
- **registration_documents**: registration_id, participant_id?, type, path, original_name, size
- **invoices**: number*, owner_id, subtotal, unique_code (1–999), discount=0, total, status, bank_name, bank_account_number, bank_account_holder (snapshot rekening), proof_path?, proof_uploaded_at?, due_at, verified_by?, verified_at?, rejection_reason?; index(status, total)
- **bank_accounts**: bank_name, account_number, account_holder, is_active, sort
- **judge_assignments**: judge_id, competition_id; unique pasangan
- **rubric_criteria**: competition_id, name, weight (uint), max_score (uint=100), sort
- **score_sheets**: registration_id, judge_id, note?, status, total? (decimal 5,2), locked_at?; unique(registration_id, judge_id)
- **scores**: score_sheet_id, criterion_id, value (decimal 5,2); unique(sheet, criterion)
- **certificate_templates**: competition_id, type, image_path, layout (json); unique(competition_id, type)
- **certificates**: registration_id, participant_id, type, placement?, number*, verification_code*, file_path?, generated_at?; unique(registration_id, participant_id)
- **announcements**: level? (null = semua), title, body, published_at?, author_id
- **settings**: key (PK string), value (json) — tanpa timestamps. Kunci: `event_name`, `contact_whatsapp`, `contact_email`, `payment_due_hours`=48, `max_competitions_per_participant`=null, `import_max_rows`=300
- Bawaan: jobs, failed_jobs, cache, sessions. F13: `activity_log`.

## 6. State Machine (transisi hanya lewat Action)

**Registration**

| Dari → Ke | Action | Aktor | Efek |
|---|---|---|---|
| (baru) → draft | SaveRegistrationDraft | pemilik | tidak menahan slot |
| draft → awaiting_payment | SubmitRegistration | pemilik | kunci baris lomba, cek BR-02..06, snapshot fee, buat kode, buat tagihan |
| awaiting_payment/rejected → awaiting_verification | UploadProof | pemilik | ikut status tagihan |
| awaiting_verification → verified | VerifyInvoice | admin | tagihan `paid` |
| awaiting_verification → rejected | RejectInvoice | admin | tagihan `rejected`, simpan alasan |
| draft/awaiting_payment/rejected → cancelled | CancelRegistration / ExpireInvoice | pemilik / scheduler | lepas slot, hapus anggota |
| verified → cancelled | CancelRegistration | admin saja | beralasan; refund manual |

**Invoice**: `unpaid → awaiting_verification → paid | rejected`; `rejected → awaiting_verification` (unggah ulang); `unpaid|rejected → expired` (lewat `due_at`); `unpaid|rejected → cancelled` (semua entri dibatalkan). Status entri selalu disinkronkan oleh Action tagihan, tidak diubah langsung dari controller.

## 7. Peta Rute dan Akses

| Area | Prefix | Middleware | Isi |
|---|---|---|---|
| Publik | `/`, `/verifikasi/{kode}` | — | beranda, verifikasi sertifikat (throttle) |
| Auth | bawaan starter kit | guest/auth | daftar (pilih tipe), masuk, lupa sandi, verifikasi email, profil |
| Portal | `/portal`, `/portal/{level}/...` | auth, verified, role:participant,institution | pilih jenjang, beranda, lomba, daftar, daftar-kolektif |
| Pengguna | `/siswa`, `/pendaftaran`, `/tagihan`, `/sertifikat` | idem | CRUD siswa, entri, tagihan + bukti, unduh sertifikat |
| Juri | `/juri/...` | auth, role:judge | dasbor, daftar entri, lembar nilai |
| Admin | `/admin/...` | auth, role:admin | lomba, rekening, pembayaran, pendaftaran, lembaga, juri, hasil, sertifikat, pengumuman, pengaturan, log |

URL lomba: `/portal/{level}/lomba/{competition:slug}`; lomba yang levelnya beda dengan `{level}` → 404.

## 8. Action Inti

- Registration: `SaveRegistrationDraft`, `SubmitRegistration`, `CancelRegistration`, `SwapMember`
- Import: `PreviewCollectiveImport` (validasi, simpan hasil di cache 30 menit via token), `CommitCollectiveImport` (semua atau tidak sama sekali)
- Invoice: `CreateInvoice` (F05), `UploadProof`, `VerifyInvoice`, `RejectInvoice`, `ExpireInvoices` (F07)
- Scoring: `SaveScoreSheet`, `LockScoreSheet`, `UnlockScoreSheet`, `ComputeFinalScores`, `SetPlacements`, `PublishResults`
- Certificate: `GenerateCertificate` (via `GenerateCertificateJob`, idempoten), `BuildCertificateZip`

Kode unik: acak 1–999 yang belum dipakai tagihan terbuka (`unpaid`, `awaiting_verification`, `rejected`) dengan `subtotal` sama; coba ulang maks 20×, lalu `BusinessRuleViolation`.
Kuota: dalam transaksi `Competition::lockForUpdate()`, hitung entri penahan slot, bandingkan dengan `quota`.

## 9. Penyimpanan Berkas

| Jenis | Disk | Akses |
|---|---|---|
| Juknis PDF | `public` | publik |
| Bukti bayar, dokumen, karya, template, sertifikat | `local` (privat) | controller + Policy, nama acak (`Str::uuid()`), `Storage::download` |

Validasi: `mimes` + `max` + cek `finfo` (MIME asli); PDF harus berawalan `%PDF`; ekstensi dari daftar putih. Pindai antivirus (ClamAV) = P2.

## 10. Notifikasi

Event: `InvoiceCreated`, `ProofUploaded` (ke admin), `InvoiceVerified`, `InvoiceRejected`, `InvoiceExpired`, `ResultsPublished`, `CertificateReady`.
Listener berantrean mengirim `Mail` dan `WhatsappGateway::send($to, $text)` (interface; driver `log`/`null`; nomor dinormalisasi ke `62…`).
Kegagalan notifikasi tidak boleh menggagalkan proses bisnis (job terpisah, retry 3×).

## 11. Pengaturan

`App\Services\Settings\Settings::get('key', default)` / `set()`, di-cache, dibersihkan saat `set`. Dikelola di `/admin/pengaturan`.

## 12. Frontend

- Layout: `PublicLayout`, `PortalLayout` (header + pengganti jenjang), `AdminLayout` (sidebar), `JudgeLayout`.
- Komponen bersama (`components/app`): `PageHeader`, `DataTable` (filter via query string, paginasi server, mode kartu di mobile), `StatusBadge` (dari `label()/color()` enum), `FileUpload`, `ConfirmDialog`, `EmptyState`, `Money`, `FormField`.
- Pola halaman: `Index` (tabel + filter) · `Form` (`useForm`, galat per field + ringkasan) · `Show`.
- Flash message lewat shared prop `flash` → toast. Format: `formatRupiah`, `formatTanggal`, `formatTanggalWaktu` di `lib/format.ts` (`id-ID`, `Asia/Jakarta`).
- Token desain (warna merek, font) ditetapkan sekali di `resources/css/app.css` (`@theme`); palet awal placeholder sampai panitia mengirim logo/warna.
- Setiap halaman: loading/disabled saat submit, empty state, pesan galat ramah (Indonesia).

## 13. Seeder dan Data Demo

`DatabaseSeeder` → admin dari env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), rekening contoh, 3 lomba per jenjang (individu, tim, karya-link). `DemoSeeder` (hanya non-produksi): peserta, sekolah, juri, entri di setiap status, tagihan, nilai, sertifikat. Dipakai untuk uji manual tiap fitur.

## 14. Definition of Done (tiap fitur)

1. Setiap AC punya test Pest `AC-Fxx-nn` yang hijau.
2. Otorisasi teruji: peran yang boleh berhasil, peran lain 403 / redirect.
3. Pesan validasi dan UI berbahasa Indonesia; tidak ada teks Inggris tersisa.
4. `composer qa` dan `npm run qa` hijau; tidak ada N+1 (lazy loading mati).
5. UI 375px tanpa scroll horizontal; tabel punya mode kartu; ada empty/loading/error state.
6. Transisi status hanya lewat Action; perubahan uang/nilai dalam transaksi.
7. Data demo fitur ini tersedia di `DemoSeeder`.
8. `docs/PROGRESS.md` diperbarui; commit `feat(Fxx): …`.

## 15. Deploy dan Operasi

- PHP 8.3 (ext: gd, intl, zip, mbstring, pdo_mysql), MySQL 8, Nginx + PHP-FPM.
- Batas unggah: `upload_max_filesize` dan `post_max_size` ≥ 60M; Nginx `client_max_body_size 60M`.
- Supervisor: `php artisan queue:work --tries=3 --timeout=120`. Cron: `* * * * * php artisan schedule:run`.
- `APP_DEBUG=false`, `APP_ENV=production`, sesi aman, HTTPS + HSTS, proxy tepercaya, `TZ=Asia/Jakarta`.
- Rilis: `composer install --no-dev -o`, `npm ci && npm run build`, `php artisan migrate --force`, `php artisan optimize`, `storage:link`.
- Backup harian (`spatie/laravel-backup`) ke disk berbeda; uji restore sekali sebelum pendaftaran dibuka.
- Uji konkurensi kuota dan uji beban dijalankan di MySQL (SQLite tidak menghormati `lockForUpdate`).

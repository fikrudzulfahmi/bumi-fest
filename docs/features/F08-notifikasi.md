# F08 — Notifikasi  [Tahap 2]
**Bergantung:** F05, F07. **Baca:** BLUEPRINT §10.

## Lingkup
- Listener berantrean untuk event: `InvoiceCreated`, `ProofUploaded` (→ semua admin), `InvoiceVerified`, `InvoiceRejected` (memuat alasan), `InvoiceExpired`; `ResultsPublished` dan `CertificateReady` disiapkan listener-nya (dipicu F11/F12).
- Mail (Notification class, Markdown mail, Indonesia, memuat tautan ke halaman terkait).
- `WhatsappGateway` (interface) + driver `log` dan `null`; pilih lewat `config('services.whatsapp.driver')`; nomor dinormalisasi. Penyedia nyata = P2.
- Kegagalan kirim tidak menggagalkan proses utama; retry 3×; gagal tercatat di `failed_jobs`.

## Kriteria Penerimaan
- AC-F08-01 Tiap event mengirim notifikasi ke penerima yang benar (Notification fake).
- AC-F08-02 Email tagihan memuat nominal total, rekening, jatuh tempo, tautan.
- AC-F08-03 Email penolakan memuat alasan dan tautan unggah ulang.
- AC-F08-04 `ProofUploaded` hanya ke admin, bukan ke juri/peserta.
- AC-F08-05 Driver `log` menulis pesan WA bernomor `62…`; driver `null` tidak melakukan apa pun.
- AC-F08-06 Pengecualian pada gateway tidak menggagalkan `VerifyInvoice` (test dengan gateway yang melempar).
- AC-F08-07 Semua notifikasi `ShouldQueue`.

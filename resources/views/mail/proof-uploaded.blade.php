<x-mail::message>
# Bukti Pembayaran Baru

Halo Admin,

Peserta **{{ $invoice->owner?->name ?? '-' }}** mengunggah bukti pembayaran untuk tagihan **{{ $invoice->number }}** sebesar **Rp{{ number_format($invoice->total, 0, ',', '.') }}**.

Mohon segera diverifikasi.

<x-mail::button :url="$url">
Buka Antrean Verifikasi
</x-mail::button>

{{ config('app.name') }}
</x-mail::message>

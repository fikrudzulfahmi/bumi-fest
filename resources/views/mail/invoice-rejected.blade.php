<x-mail::message>
# Bukti Pembayaran Perlu Diperbaiki

Halo {{ $invoice->owner?->name ?? 'Peserta' }},

Bukti pembayaran untuk tagihan **{{ $invoice->number }}** belum dapat kami terima.

**Alasan:** {{ $reason }}

Silakan unggah ulang bukti pembayaran yang benar melalui halaman tagihan.

<x-mail::button :url="$url">
Unggah Ulang Bukti
</x-mail::button>

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>

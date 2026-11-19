<x-mail::message>
# Pembayaran Diverifikasi

Halo {{ $invoice->owner?->name ?? 'Peserta' }},

Pembayaran untuk tagihan **{{ $invoice->number }}** sebesar **Rp{{ number_format($invoice->total, 0, ',', '.') }}** sudah kami verifikasi. Pendaftaran Anda kini aktif.

<x-mail::button :url="$url">
Lihat Tagihan
</x-mail::button>

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>

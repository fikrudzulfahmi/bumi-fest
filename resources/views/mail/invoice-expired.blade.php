<x-mail::message>
# Tagihan Kedaluwarsa

Halo {{ $invoice->owner?->name ?? 'Peserta' }},

Tagihan **{{ $invoice->number }}** sudah melewati jatuh tempo sehingga dibatalkan otomatis. Slot pendaftaran Anda dilepas.

Bila masih ingin mengikuti lomba, silakan mendaftar ulang selama kuota tersedia.

<x-mail::button :url="$url">
Lihat Tagihan
</x-mail::button>

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>

<x-mail::message>
# Sertifikat Siap Diunduh

Halo,

Sertifikat untuk entri **{{ $registration->code }}** pada lomba **{{ $registration->competition?->name ?? '-' }}** sudah siap diunduh.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>

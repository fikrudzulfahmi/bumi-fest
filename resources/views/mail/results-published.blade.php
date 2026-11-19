<x-mail::message>
# Hasil Lomba Dipublikasikan

Halo,

Hasil lomba **{{ $registration->competition?->name ?? '-' }}** untuk entri **{{ $registration->code }}** sudah dipublikasikan.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>

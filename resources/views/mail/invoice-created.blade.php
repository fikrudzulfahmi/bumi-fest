<x-mail::message>
# Tagihan Pendaftaran

Halo {{ $invoice->owner?->name ?? 'Peserta' }},

Berikut rincian tagihan pendaftaran Anda.

<x-mail::table>
| Keterangan | Nilai |
|:--|--:|
| Nomor tagihan | {{ $invoice->number }} |
| Subtotal | Rp{{ number_format($invoice->subtotal, 0, ',', '.') }} |
| Kode unik | {{ $invoice->unique_code }} |
| **Total transfer** | **Rp{{ number_format($invoice->total, 0, ',', '.') }}** |
| Rekening | {{ $invoice->bank_name }} {{ $invoice->bank_account_number }} a.n. {{ $invoice->bank_account_holder }} |
| Jatuh tempo | {{ $invoice->due_at?->format('d/m/Y H:i') }} WIB |
</x-mail::table>

Transfer **tepat sampai kode unik** agar pembayaran mudah diverifikasi. Setelah transfer, unggah bukti pada halaman tagihan.

<x-mail::button :url="$url">
Lihat Tagihan
</x-mail::button>

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>

<?php

namespace App\Exports;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * AC-F09-03: ekspor pembayaran mengikuti filter aktif.
 *
 * @implements WithMapping<Invoice>
 */
class AdminPaymentExport implements FromQuery, WithHeadings, WithMapping
{
    /**
     * @param  Builder<Invoice>  $query
     */
    public function __construct(private readonly Builder $query) {}

    /**
     * @return Builder<Invoice>
     */
    public function query(): Builder
    {
        return $this->query;
    }

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return [
            'Nomor Tagihan',
            'Pemilik',
            'Email',
            'Subtotal',
            'Kode Unik',
            'Total',
            'Status',
            'Jatuh Tempo',
            'Dibayar Pada',
        ];
    }

    /**
     * @param  Invoice  $invoice
     * @return list<string|int|null>
     */
    public function map($invoice): array
    {
        return [
            $invoice->number,
            $invoice->owner?->name,
            $invoice->owner?->email,
            $invoice->subtotal,
            $invoice->unique_code,
            $invoice->total,
            $invoice->status->label(),
            $invoice->due_at?->format('Y-m-d H:i'),
            $invoice->verified_at?->format('Y-m-d H:i'),
        ];
    }
}

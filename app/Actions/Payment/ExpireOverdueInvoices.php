<?php

namespace App\Actions\Payment;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Events\InvoiceExpired;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class ExpireOverdueInvoices
{
    /**
     * AC-F07-09: hanya tagihan `unpaid`/`rejected` yang lewat `due_at` menjadi
     * `expired`; entri `cancelled` sehingga slotnya lepas.
     *
     * @return int jumlah tagihan yang kedaluwarsa
     */
    public function handle(): int
    {
        $expired = 0;

        Invoice::query()
            ->whereIn('status', [InvoiceStatus::Unpaid, InvoiceStatus::Rejected])
            ->whereNotNull('due_at')
            ->where('due_at', '<', now('Asia/Jakarta'))
            ->orderBy('id')
            ->chunkById(100, function ($invoices) use (&$expired) {
                foreach ($invoices as $invoice) {
                    DB::transaction(function () use ($invoice) {
                        /** @var Invoice $locked */
                        $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

                        if (! in_array($locked->status, [InvoiceStatus::Unpaid, InvoiceStatus::Rejected], true)) {
                            return;
                        }

                        $locked->forceFill([
                            'status' => InvoiceStatus::Expired,
                        ])->save();

                        // BR-03: entri batal → slot lepas
                        $locked->registrations()->update([
                            'status' => RegistrationStatus::Cancelled->value,
                        ]);

                        event(new InvoiceExpired($locked));

                        activity()
                            ->performedOn($locked)
                            ->withProperties(['status' => 'expired', 'number' => $locked->number])
                            ->log('Tagihan kedaluwarsa');
                    });

                    $expired++;
                }
            });

        return $expired;
    }
}

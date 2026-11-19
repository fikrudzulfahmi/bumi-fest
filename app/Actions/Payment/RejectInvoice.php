<?php

namespace App\Actions\Payment;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Events\InvoiceRejected;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RejectInvoice
{
    /**
     * Tolak bukti pembayaran (AC-F07-07): alasan wajib, tagihan & entri `rejected`.
     * Pengguna dapat mengunggah ulang bukti setelahnya.
     */
    public function handle(User $admin, Invoice $invoice, string $reason): Invoice
    {
        $reason = trim($reason);

        if ($reason === '') {
            throw new BusinessRuleViolation('Alasan penolakan wajib diisi.');
        }

        $invoice = DB::transaction(function () use ($admin, $invoice, $reason) {
            /** @var Invoice $locked */
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== InvoiceStatus::AwaitingVerification) {
                throw new BusinessRuleViolation('Tagihan ini sudah diproses.');
            }

            $locked->forceFill([
                'status' => InvoiceStatus::Rejected,
                'verified_by' => $admin->id,
                'verified_at' => now('Asia/Jakarta'),
                'rejection_reason' => $reason,
            ])->save();

            $locked->registrations()->update([
                'status' => RegistrationStatus::Rejected->value,
            ]);

            return $locked;
        });

        event(new InvoiceRejected($invoice, $reason));

        return $invoice->fresh() ?? $invoice;
    }
}

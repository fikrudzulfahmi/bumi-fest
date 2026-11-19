<?php

namespace App\Actions\Payment;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Events\InvoiceVerified;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class VerifyInvoice
{
    /**
     * Terima pembayaran (AC-F07-06): tagihan `paid`, semua entri `verified`,
     * verified_by/at tercatat. Dua admin bersamaan → yang kedua ditolak (AC-F07-08).
     */
    public function handle(User $admin, Invoice $invoice): Invoice
    {
        $invoice = DB::transaction(function () use ($admin, $invoice) {
            /** @var Invoice $locked */
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== InvoiceStatus::AwaitingVerification) {
                throw new BusinessRuleViolation('Tagihan ini sudah diproses.');
            }

            $locked->forceFill([
                'status' => InvoiceStatus::Paid,
                'verified_by' => $admin->id,
                'verified_at' => now('Asia/Jakarta'),
                'rejection_reason' => null,
            ])->save();

            $locked->registrations()->update([
                'status' => RegistrationStatus::Verified->value,
            ]);

            return $locked;
        });

        event(new InvoiceVerified($invoice));

        return $invoice->fresh() ?? $invoice;
    }
}

<?php

namespace App\Actions\Payment;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ExtendInvoiceDueDate
{
    /**
     * Perpanjang jatuh tempo (AC-F07-11): tagihan `unpaid`/`rejected` hidup kembali
     * dengan tenggat baru, dan entrinya kembali menunggu pembayaran.
     */
    public function handle(User $admin, Invoice $invoice, int $hours): Invoice
    {
        if ($hours < 1 || $hours > 720) {
            throw new BusinessRuleViolation('Perpanjangan jatuh tempo 1–720 jam.');
        }

        return DB::transaction(function () use ($invoice, $hours) {
            /** @var Invoice $locked */
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if (! in_array($locked->status, [InvoiceStatus::Unpaid, InvoiceStatus::Rejected], true)) {
                throw new BusinessRuleViolation(
                    'Tagihan berstatus '.$locked->status->label().' tidak dapat diperpanjang.'
                );
            }

            $locked->forceFill([
                'status' => InvoiceStatus::Unpaid,
                'due_at' => now('Asia/Jakarta')->addHours($hours),
                'verified_by' => null,
                'verified_at' => null,
                'rejection_reason' => null,
            ])->save();

            $locked->registrations()->update([
                'status' => RegistrationStatus::AwaitingPayment->value,
            ]);

            return $locked->fresh() ?? $locked;
        });
    }
}

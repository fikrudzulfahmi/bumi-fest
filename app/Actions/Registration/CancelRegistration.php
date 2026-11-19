<?php

namespace App\Actions\Registration;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CancelRegistration
{
    /**
     * Batalkan entri (AC-F05-13): hanya draft/awaiting_payment/rejected
     * boleh dibatalkan oleh pemilik; verified hanya admin (di luar sini).
     * Lepas slot, hapus anggota, batalkan tagihan bila tak ada entri lain.
     */
    public function handle(User $user, Registration $registration): Registration
    {
        return DB::transaction(function () use ($registration) {
            $allowed = [
                RegistrationStatus::Draft,
                RegistrationStatus::AwaitingPayment,
                RegistrationStatus::Rejected,
            ];

            if (! in_array($registration->status, $allowed, true)) {
                throw new BusinessRuleViolation('Entri ini tidak dapat dibatalkan.');
            }

            $registration->update(['status' => RegistrationStatus::Cancelled]);

            // Lepas slot & anggota
            $registration->members()->delete();

            // Batalkan tagihan bila tidak ada entri lain yang sama-sama memakainya
            if ($registration->invoice_id) {
                $invoice = $registration->invoice;
                $hasOtherEntry = Registration::where('invoice_id', $invoice->id)
                    ->where('id', '!=', $registration->id)
                    ->whereIn('status', Registration::slotHoldingStatuses())
                    ->exists();

                if (! $hasOtherEntry && in_array($invoice->status, [InvoiceStatus::Unpaid, InvoiceStatus::Rejected], true)) {
                    $invoice->update(['status' => InvoiceStatus::Cancelled]);
                }
            }

            return $registration->fresh();
        });
    }
}

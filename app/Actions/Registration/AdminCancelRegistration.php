<?php

namespace App\Actions\Registration;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * BR: pembatalan entri `verified` hanya oleh Admin dan wajib beralasan (AC-F09-04).
 * Slot dilepas, anggota dihapus, refund ditangani manual di luar sistem.
 */
class AdminCancelRegistration
{
    public function handle(User $admin, Registration $registration, string $reason): Registration
    {
        if (! $admin->isAdmin()) {
            throw new BusinessRuleViolation('Hanya admin yang boleh membatalkan entri terverifikasi.');
        }

        if (trim($reason) === '') {
            throw new BusinessRuleViolation('Alasan pembatalan wajib diisi.');
        }

        return DB::transaction(function () use ($registration) {
            $registration = Registration::query()->lockForUpdate()->findOrFail($registration->id);

            if ($registration->status === RegistrationStatus::Cancelled) {
                throw new BusinessRuleViolation('Entri ini sudah dibatalkan.');
            }

            $registration->update(['status' => RegistrationStatus::Cancelled]);

            // Lepas slot: baris anggota dihapus agar siswa bisa didaftarkan lagi.
            // Dokumen disimpan sebagai arsip pembatalan.
            $registration->members()->delete();

            if ($registration->invoice_id !== null) {
                $invoice = $registration->invoice;

                $hasOtherEntry = Registration::query()
                    ->where('invoice_id', $invoice->id)
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

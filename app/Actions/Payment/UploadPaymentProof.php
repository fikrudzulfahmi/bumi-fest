<?php

namespace App\Actions\Payment;

use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Events\ProofUploaded;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Invoice;
use App\Services\Upload\FileValidator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UploadPaymentProof
{
    /**
     * Unggah bukti pembayaran (AC-F07-03/04):
     * - hanya untuk status unpaid/rejected (bukan awaiting, paid, expired, cancelled),
     * - berkas jpg/png/pdf ≤ 5 MB, MIME asli diverifikasi,
     * - invoice + semua entri → awaiting_verification.
     */
    public function handle(Invoice $invoice, UploadedFile $file): Invoice
    {
        FileValidator::validate(
            $file,
            FileValidator::documentExtensions(),
            FileValidator::documentMimes(),
        );

        $previousPath = null;

        $invoice = DB::transaction(function () use ($invoice, $file, &$previousPath) {
            /** @var Invoice $locked */
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if (! in_array($locked->status, [InvoiceStatus::Unpaid, InvoiceStatus::Rejected], true)) {
                throw new BusinessRuleViolation(
                    'Bukti pembayaran tidak dapat diunggah untuk tagihan berstatus '
                    .$locked->status->label().'.'
                );
            }

            $previousPath = $locked->proof_path;

            $path = $file->store('invoices/'.$locked->id, 'local');

            $locked->forceFill([
                'proof_path' => $path,
                'proof_uploaded_at' => now('Asia/Jakarta'),
                'status' => InvoiceStatus::AwaitingVerification,
                'rejection_reason' => null,
            ])->save();

            // Semua entri dalam tagihan ikut menunggu verifikasi
            $locked->registrations()->update([
                'status' => RegistrationStatus::AwaitingVerification->value,
            ]);

            return $locked;
        });

        if (is_string($previousPath) && $previousPath !== '' && $previousPath !== $invoice->proof_path) {
            Storage::disk('local')->delete($previousPath);
        }

        event(new ProofUploaded($invoice));

        return $invoice->fresh() ?? $invoice;
    }
}

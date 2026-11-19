<?php

namespace App\Actions\Invoice;

use App\Enums\InvoiceStatus;
use App\Events\InvoiceCreated;
use App\Exceptions\BusinessRuleViolation;
use App\Models\BankAccount;
use App\Models\Invoice;
use App\Models\Registration;
use App\Services\Settings\Settings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateInvoice
{
    /**
     * Buat tagihan dari pendaftaran (BR-07):
     * - snapshot rekening aktif (AC-F04-06),
     * - kode unik 1–999 per subtotal (AC-F05-15),
     * - due_at dari setting payment_due_hours.
     */
    public function handle(Registration $registration): Invoice
    {
        $invoice = DB::transaction(function () use ($registration) {
            $bankAccount = BankAccount::active()->first();

            if (! $bankAccount) {
                throw new BusinessRuleViolation(
                    'Tidak ada rekening aktif. Hubungi panitia untuk pembayaran.'
                );
            }

            $subtotal = (int) $registration->fee;
            $uniqueCode = app(PickUniqueCode::class)->handle($subtotal);
            $dueHours = (int) Settings::get('payment_due_hours', 48);

            // BR-07: total = jumlah biaya entri + kode unik 1–999;
            // tidak boleh ada dua tagihan terbuka dengan total sama.
            $total = $subtotal + $uniqueCode;

            $invoice = Invoice::create([
                'number' => 'INV-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
                'owner_id' => $registration->owner_id,
                'subtotal' => $subtotal,
                'unique_code' => $uniqueCode,
                'discount' => 0,
                'total' => $total,
                'status' => InvoiceStatus::Unpaid,
                'bank_name' => $bankAccount->bank_name,
                'bank_account_number' => $bankAccount->account_number,
                'bank_account_holder' => $bankAccount->account_holder,
                'due_at' => now('Asia/Jakarta')->addHours($dueHours),
            ]);

            $registration->forceFill([
                'invoice_id' => $invoice->id,
            ])->save();

            return $invoice;
        });

        event(new InvoiceCreated($invoice));

        return $invoice;
    }
}

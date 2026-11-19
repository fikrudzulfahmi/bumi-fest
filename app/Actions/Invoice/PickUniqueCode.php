<?php

namespace App\Actions\Invoice;

use App\Exceptions\BusinessRuleViolation;
use App\Models\Invoice;

class PickUniqueCode
{
    /**
     * BR-07 / AC-F05-15: kode 1–999 unik per subtotal, dan total
     * (subtotal + kode) tidak boleh sama dengan tagihan terbuka mana pun.
     * Maks 20 percobaan.
     */
    public function handle(int $subtotal): int
    {
        $openInvoices = Invoice::open()->get(['subtotal', 'unique_code', 'total']);

        $usedCodes = $openInvoices
            ->where('subtotal', $subtotal)
            ->pluck('unique_code')
            ->all();

        $usedTotals = $openInvoices->pluck('total')->all();

        for ($i = 0; $i < 20; $i++) {
            $candidate = random_int(1, 999);

            if (in_array($candidate, $usedCodes, true) || in_array($subtotal + $candidate, $usedTotals, true)) {
                continue;
            }

            return $candidate;
        }

        throw new BusinessRuleViolation('Tidak dapat menentukan kode pembayaran. Coba lagi nanti.');
    }
}

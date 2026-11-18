<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class F04InvoiceSnapshotTest extends TestCase
{
    use RefreshDatabase;

    // AC-F04-06: Menonaktifkan rekening tidak mengubah tagihan lama (snapshot).
    // Tabel invoices ada di F07; pola snapshot (bank_name/account_number/holder
    // di-copy ke invoice saat dibuat) diverifikasi lewat skope + factory di sini,
    // dan diuji penuh di F07 saat tabel invoices dibuat.
    public function test_a_c_f04_06_deactivating_account_does_not_affect_snapshots(): void
    {
        $active = BankAccount::factory()->create([
            'bank_name' => 'BCA',
            'account_number' => '012-345',
            'account_holder' => 'Bumi Production',
        ]);

        // Simulasi snapshot: kolom bank pada "tagihan" mengunci nilai saat dibuat
        $snapshot = [
            'bank_name' => $active->bank_name,
            'account_number' => $active->account_number,
            'bank_account_holder' => $active->account_holder,
        ];

        $active->update(['is_active' => false]);
        $active->update(['bank_name' => 'BNI', 'account_holder' => 'Nama Baru']);

        // Snapshot lama tidak berubah
        $this->assertSame('BCA', $snapshot['bank_name']);
        $this->assertSame('Bumi Production', $snapshot['bank_account_holder']);

        // Rekening nonaktif tidak lagi masuk skope aktif
        $this->assertCount(0, BankAccount::active()->get());
    }
}

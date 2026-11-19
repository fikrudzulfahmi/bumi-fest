<?php

namespace App\Actions\BankAccount;

use App\Models\BankAccount;
use Illuminate\Support\Facades\DB;

class DeleteBankAccount
{
    public function handle(BankAccount $account): void
    {
        DB::transaction(function () use ($account) {
            $account->delete();
        });

        activity()
            ->withProperties(['bank_name' => $account->bank_name, 'account_number' => $account->account_number])
            ->log('Rekening dihapus');
    }
}

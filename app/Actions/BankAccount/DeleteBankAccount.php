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
    }
}

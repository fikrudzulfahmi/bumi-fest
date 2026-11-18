<?php

namespace App\Actions\BankAccount;

use App\Models\BankAccount;
use Illuminate\Support\Facades\DB;

class UpdateBankAccount
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(BankAccount $account, array $data): BankAccount
    {
        return DB::transaction(function () use ($account, $data) {
            $account->update($data);

            return $account;
        });
    }
}

<?php

namespace App\Actions\BankAccount;

use App\Models\BankAccount;
use Illuminate\Support\Facades\DB;

class StoreBankAccount
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): BankAccount
    {
        $account = DB::transaction(function () use ($data) {
            return BankAccount::create($data);
        });

        activity()
            ->performedOn($account)
            ->withProperties(['bank_name' => $account->bank_name, 'account_number' => $account->account_number])
            ->log('Rekening ditambahkan');

        return $account;
    }
}

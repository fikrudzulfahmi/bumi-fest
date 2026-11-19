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
        $account = DB::transaction(function () use ($account, $data) {
            $account->update($data);

            return $account;
        });

        activity()
            ->performedOn($account)
            ->withProperties(['bank_name' => $account->bank_name, 'account_number' => $account->account_number])
            ->log('Rekening diperbarui');

        return $account;
    }
}

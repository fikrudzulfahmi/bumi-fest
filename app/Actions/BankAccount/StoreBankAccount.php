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
        return DB::transaction(function () use ($data) {
            return BankAccount::create($data);
        });
    }
}

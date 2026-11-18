<?php

namespace App\Policies;

use App\Models\BankAccount;
use App\Models\User;

class BankAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, BankAccount $bankAccount): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, BankAccount $bankAccount): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, BankAccount $bankAccount): bool
    {
        return $user->isAdmin();
    }
}

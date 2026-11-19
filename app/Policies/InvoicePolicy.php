<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    /**
     * AC-F07-02: pemilik atau admin.
     */
    public function view(User $user, Invoice $invoice): bool
    {
        return $user->role === Role::Admin || $invoice->owner_id === $user->id;
    }

    /**
     * AC-F07-10: admin saja.
     */
    public function verify(User $user, Invoice $invoice): bool
    {
        return $user->role === Role::Admin;
    }

    public function reject(User $user, Invoice $invoice): bool
    {
        return $user->role === Role::Admin;
    }

    public function extend(User $user, Invoice $invoice): bool
    {
        return $user->role === Role::Admin;
    }
}

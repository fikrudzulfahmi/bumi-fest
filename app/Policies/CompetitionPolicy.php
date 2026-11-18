<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Competition;
use App\Models\User;

class CompetitionPolicy
{
    public function view(User $user, Competition $competition): bool
    {
        return match ($user->role) {
            Role::Participant, Role::Institution => true,
            default => false,
        };
    }
}

<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Competition;
use App\Models\User;

class CompetitionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Competition $competition): bool
    {
        return match ($user->role) {
            Role::Participant, Role::Institution => true,
            default => false,
        };
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }

    public function publish(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }

    public function archive(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }

    public function duplicate(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }
}

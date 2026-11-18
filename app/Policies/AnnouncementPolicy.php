<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\User;

class AnnouncementPolicy
{
    public function view(User $user, Announcement $announcement): bool
    {
        return match ($user->role) {
            Role::Participant, Role::Institution => true,
            default => false,
        };
    }

    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Announcement $announcement): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Announcement $announcement): bool
    {
        return $user->isAdmin();
    }
}

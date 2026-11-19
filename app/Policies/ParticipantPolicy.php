<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Participant;
use App\Models\User;

class ParticipantPolicy
{
    public function viewAny(User $user): bool
    {
        return match ($user->role) {
            Role::Participant, Role::Institution => true,
            default => false,
        };
    }

    /**
     * Siswa hanya milik pengguna sendiri (AC-F05-02).
     */
    public function view(User $user, Participant $participant): bool
    {
        return $participant->owner_id === $user->id;
    }

    public function create(User $user): bool
    {
        return match ($user->role) {
            Role::Participant, Role::Institution => true,
            default => false,
        };
    }

    public function update(User $user, Participant $participant): bool
    {
        return $participant->owner_id === $user->id;
    }

    public function delete(User $user, Participant $participant): bool
    {
        return $participant->owner_id === $user->id;
    }
}

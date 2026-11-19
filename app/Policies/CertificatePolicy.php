<?php

namespace App\Policies;

use App\Models\Certificate;
use App\Models\User;

/**
 * AC-F12-06/07: pemilik entri bisa unduh, admin semua; lembaga unduh ZIP
 * hanya sertifikat siswanya.
 */
class CertificatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin()
            || $user->isInstitution()
            || (! $user->isJudge());
    }

    public function view(User $user, Certificate $certificate): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $owner = $certificate->registration()->value('owner_id');

        return $owner === $user->id;
    }

    public function download(User $user, Certificate $certificate): bool
    {
        return $this->view($user, $certificate);
    }
}

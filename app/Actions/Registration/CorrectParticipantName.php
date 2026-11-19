<?php

namespace App\Actions\Registration;

use App\Actions\Certificate\RegenerateCertificatePdf;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Participant;
use App\Models\User;

/**
 * BR-16: setelah hasil terbit hanya Admin yang boleh mengoreksi nama siswa.
 * Sertifikat terkait dirender ulang dengan nomor yang sama (AC-F12-10).
 */
class CorrectParticipantName
{
    public function __construct(private readonly RegenerateCertificatePdf $regenerate) {}

    public function handle(User $admin, Participant $participant, string $name): Participant
    {
        if (! $admin->isAdmin()) {
            throw new BusinessRuleViolation('Hanya admin yang boleh mengoreksi nama siswa.');
        }

        $name = trim($name);

        if (mb_strlen($name) < 3) {
            throw new BusinessRuleViolation('Nama siswa minimal 3 karakter.');
        }

        $participant->update(['name' => $name]);

        foreach ($participant->certificates as $certificate) {
            $this->regenerate->handle($certificate);
        }

        return $participant->fresh();
    }
}

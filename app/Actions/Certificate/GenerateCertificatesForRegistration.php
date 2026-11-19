<?php

namespace App\Actions\Certificate;

use App\Enums\RegistrationStatus;
use App\Events\CertificateReady;
use App\Models\Participant;
use App\Models\Registration;

/**
 * BR-14: buat sertifikat untuk SEMUA anggota entri verified dalam satu lomba.
 * Memanggil GenerateCertificate per (entri, anggota); idempoten.
 */
class GenerateCertificatesForRegistration
{
    public function __construct(private readonly GenerateCertificate $generate) {}

    public function handle(Registration $registration): int
    {
        if ($registration->status !== RegistrationStatus::Verified) {
            return 0;
        }

        $members = $registration->members()->with('participant')->get();

        if ($members->isEmpty()) {
            return 0;
        }

        $count = 0;

        foreach ($members as $member) {
            /** @var Participant|null $participant */
            $participant = $member->participant;

            if ($participant === null) {
                continue;
            }

            $this->generate->handle($registration, $participant);
            $count++;
        }

        CertificateReady::dispatch($registration);

        return $count;
    }
}

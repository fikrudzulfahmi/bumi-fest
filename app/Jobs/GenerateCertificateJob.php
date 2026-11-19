<?php

namespace App\Jobs;

use App\Actions\Certificate\GenerateCertificate;
use App\Models\Participant;
use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * BR-14: satu job per anggota entri verified (idempoten).
 */
class GenerateCertificateJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly int $registrationId,
        public readonly int $participantId,
    ) {}

    public function handle(GenerateCertificate $generate): void
    {
        $registration = Registration::query()->findOrFail($this->registrationId);
        $participant = Participant::query()->findOrFail($this->participantId);

        $generate->handle($registration, $participant);
    }
}

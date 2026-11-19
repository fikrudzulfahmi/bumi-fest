<?php

namespace App\Jobs;

use App\Enums\RegistrationStatus;
use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * AC-F12-02/04: setelah hasil terbit, antre satu GenerateCertificateJob
 * per anggota entri verified. Dipanggil dari PublishResults (F11).
 */
class GenerateCertificatesForCompetition implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly int $competitionId,
    ) {}

    public function handle(): void
    {
        $registrations = Registration::query()
            ->where('competition_id', $this->competitionId)
            ->where('status', RegistrationStatus::Verified)
            ->with('members')
            ->get();

        foreach ($registrations as $registration) {
            foreach ($registration->members as $member) {
                GenerateCertificateJob::dispatch($registration->id, $member->participant_id);
            }
        }
    }
}

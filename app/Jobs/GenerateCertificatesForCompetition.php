<?php

namespace App\Jobs;

use App\Enums\RegistrationStatus;
use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * AC-F11-10: pemicu pembuatan sertifikat setelah hasil terbit.
 * Pembuatan sertifikat sesungguhnya dikerjakan F12 (GenerateCertificateJob);
 * job ini hanya memilih entri terverifikasi sebagai sasaran, sehingga
 * penerbitan F11 tidak bergantung pada modul F12.
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
            ->pluck('id');

        Log::info('Sertifikat menunggu dibuat (F12)', [
            'competition_id' => $this->competitionId,
            'registrations' => $registrations->count(),
        ]);
    }
}

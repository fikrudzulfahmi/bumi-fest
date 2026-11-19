<?php

namespace App\Actions\Scoring;

use App\Enums\RegistrationStatus;
use App\Events\ResultsPublished;
use App\Exceptions\BusinessRuleViolation;
use App\Jobs\GenerateCertificatesForCompetition;
use App\Models\Competition;
use App\Models\Registration;
use Illuminate\Support\Facades\DB;

/**
 * AC-F11-09/10: terbitkan hasil lomba.
 * Diblokir bila masih ada entri terverifikasi tanpa nilai lengkap,
 * kecuali admin memilih "terbitkan tanpa nilai lengkap" (BR-13).
 */
class PublishResults
{
    public function __construct(private readonly ComputeFinalScores $compute) {}

    public function handle(Competition $competition, bool $allowIncomplete = false): Competition
    {
        if ($competition->results_published_at !== null) {
            throw new BusinessRuleViolation('Hasil lomba ini sudah diterbitkan.');
        }

        $this->compute->handle($competition);

        if (! $allowIncomplete) {
            $incomplete = Registration::query()
                ->where('competition_id', $competition->id)
                ->where('status', RegistrationStatus::Verified)
                ->whereNull('final_score')
                ->count();

            if ($incomplete > 0) {
                throw new BusinessRuleViolation(
                    "Masih ada {$incomplete} entri terverifikasi yang nilainya belum lengkap. "
                    .'Lengkapi penilaian atau pilih "terbitkan tanpa nilai lengkap".',
                );
            }
        }

        DB::transaction(function () use ($competition): void {
            $competition->forceFill(['results_published_at' => now('Asia/Jakarta')])->save();
        });

        $competition->refresh();

        // AC-F11-10: sertifikat dibuat di antrean (F12) + event untuk notifikasi.
        GenerateCertificatesForCompetition::dispatch($competition->id);
        ResultsPublished::dispatch($competition);

        activity()
            ->performedOn($competition)
            ->withProperties(['allow_incomplete' => $allowIncomplete])
            ->log('Hasil lomba diterbitkan');

        return $competition;
    }
}

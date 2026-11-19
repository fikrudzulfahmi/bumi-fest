<?php

namespace App\Actions\Scoring;

use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Registration;
use App\Services\Scoring\FinalScoreCalculator;
use Illuminate\Support\Facades\DB;

/**
 * BR-12: hitung & simpan nilai akhir per entri terverifikasi.
 * Entri yang lembarnya belum lengkap tetap `final_score = null`.
 */
class ComputeFinalScores
{
    public function __construct(private readonly FinalScoreCalculator $calculator) {}

    public function handle(Competition $competition): int
    {
        $criteria = $competition->rubricCriteria()->get();
        $assignedJudges = $competition->judgeAssignments()->count();

        $registrations = Registration::query()
            ->where('competition_id', $competition->id)
            ->where('status', RegistrationStatus::Verified)
            ->with('scoreSheets.scores')
            ->get();

        $updated = 0;

        DB::transaction(function () use ($registrations, $criteria, $assignedJudges, &$updated): void {
            foreach ($registrations as $registration) {
                $locked = $registration->scoreSheets
                    ->filter(fn ($sheet) => $sheet->locked_at !== null)
                    ->values();

                $finalScore = $this->calculator->average($criteria, $locked, $assignedJudges);

                $registration->forceFill(['final_score' => $finalScore])->save();
                $updated++;
            }
        });

        return $updated;
    }
}

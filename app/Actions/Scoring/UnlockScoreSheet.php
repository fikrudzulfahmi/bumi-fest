<?php

namespace App\Actions\Scoring;

use App\Enums\ScoreSheetStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\ScoreSheet;
use Illuminate\Support\Facades\DB;

/**
 * AC-F11-05: admin membuka kunci lembar (hanya sebelum hasil terbit).
 * Status kembali `draft`, total & locked_at dikosongkan.
 */
class UnlockScoreSheet
{
    public function handle(ScoreSheet $sheet): ScoreSheet
    {
        $competition = $sheet->registration->competition;

        if ($competition->results_published_at !== null) {
            throw new BusinessRuleViolation('Hasil lomba sudah diterbitkan. Nilai tidak bisa dibuka lagi.');
        }

        if ($sheet->status !== ScoreSheetStatus::Locked) {
            throw new BusinessRuleViolation('Lembar nilai ini belum dikunci.');
        }

        DB::transaction(function () use ($sheet): void {
            $sheet->forceFill([
                'status' => ScoreSheetStatus::Draft,
                'total' => null,
                'locked_at' => null,
            ])->save();
        });

        activity()
            ->performedOn($sheet)
            ->withProperties(['status' => 'draft'])
            ->log('Lembar nilai dibuka kembali');

        return $sheet->refresh();
    }

    public function handleCompetition(Competition $competition): void
    {
        if ($competition->results_published_at !== null) {
            throw new BusinessRuleViolation('Hasil lomba sudah diterbitkan. Nilai tidak bisa dibuka lagi.');
        }

        $sheets = ScoreSheet::query()
            ->whereIn('registration_id', $competition->registrations()->select('id'))
            ->get();

        foreach ($sheets as $sheet) {
            $sheet->forceFill([
                'status' => ScoreSheetStatus::Draft,
                'total' => null,
                'locked_at' => null,
            ])->save();

            activity()
                ->performedOn($sheet)
                ->withProperties(['status' => 'draft'])
                ->log('Lembar nilai dibuka kembali');
        }
    }
}

<?php

namespace App\Actions\Judge;

use App\Exceptions\BusinessRuleViolation;
use App\Models\JudgeAssignment;
use App\Models\ScoreSheet;

/**
 * AC-F10-03: hapus penugasan hanya bila belum ada lembar nilai juri tersebut
 * pada lomba terkait.
 */
class RemoveJudgeAssignment
{
    public function handle(JudgeAssignment $assignment): void
    {
        $hasScores = ScoreSheet::query()
            ->where('judge_id', $assignment->judge_id)
            ->whereHas('registration', fn ($q) => $q->where('competition_id', $assignment->competition_id))
            ->exists();

        if ($hasScores) {
            throw new BusinessRuleViolation(
                'Penugasan tidak dapat dihapus: juri sudah memiliki lembar nilai pada lomba ini.',
            );
        }

        $assignment->delete();
    }
}

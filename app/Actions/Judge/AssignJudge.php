<?php

namespace App\Actions\Judge;

use App\Exceptions\BusinessRuleViolation;
use App\Models\JudgeAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * AC-F10-03: penugasan unik per pasangan juri–lomba.
 */
class AssignJudge
{
    public function handle(User $judge, int $competitionId): JudgeAssignment
    {
        if (! $judge->isJudge()) {
            throw new BusinessRuleViolation('Akun ini bukan juri.');
        }

        if (! $judge->is_active) {
            throw new BusinessRuleViolation('Akun juri sedang nonaktif.');
        }

        return DB::transaction(function () use ($judge, $competitionId): JudgeAssignment {
            $exists = JudgeAssignment::query()
                ->where('judge_id', $judge->id)
                ->where('competition_id', $competitionId)
                ->exists();

            if ($exists) {
                throw new BusinessRuleViolation('Juri sudah ditugaskan pada lomba ini.');
            }

            return JudgeAssignment::create([
                'judge_id' => $judge->id,
                'competition_id' => $competitionId,
            ]);
        });
    }
}

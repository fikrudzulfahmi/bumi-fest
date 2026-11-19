<?php

namespace App\Services\Scoring;

use App\Models\RubricCriterion;
use App\Models\Score;
use App\Models\ScoreSheet;
use Illuminate\Support\Collection;

/**
 * BR-12: total lembar = Σ (nilai / max × bobot); nilai akhir = rata-rata total
 * semua juri yang ditugaskan, hanya bila seluruh lembar terkunci.
 * Pembulatan half-up 2 desimal.
 */
class FinalScoreCalculator
{
    /**
     * @param  Collection<int, RubricCriterion>  $criteria
     */
    public function sheetTotal(Collection $criteria, ScoreSheet $sheet): ?float
    {
        if ($criteria->isEmpty()) {
            return null;
        }

        /** @var Collection<int, Score> $scores */
        $scores = $sheet->scores->keyBy('criterion_id');
        $total = 0.0;

        foreach ($criteria as $criterion) {
            $score = $scores->get($criterion->id);

            if ($score === null) {
                return null;
            }

            $max = max(1, $criterion->max_score);
            $total += (float) $score->value / $max * $criterion->weight;
        }

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * @param  Collection<int, RubricCriterion>  $criteria
     * @param  Collection<int, ScoreSheet>  $lockedSheets
     */
    public function average(Collection $criteria, Collection $lockedSheets, int $assignedJudges): ?float
    {
        if ($assignedJudges < 1 || $lockedSheets->count() < $assignedJudges) {
            return null;
        }

        $totals = [];

        foreach ($lockedSheets as $sheet) {
            $total = $this->sheetTotal($criteria, $sheet);

            if ($total === null) {
                return null;
            }

            $totals[] = $total;
        }

        if ($totals === []) {
            return null;
        }

        return round(array_sum($totals) / count($totals), 2, PHP_ROUND_HALF_UP);
    }
}

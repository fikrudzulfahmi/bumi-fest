<?php

namespace App\Services\Scoring;

use App\Models\Competition;
use App\Models\RubricCriterion;

/**
 * AC-F10-04: status rubrik "siap" hanya bila total bobot = 100.
 * AC-F10-05: rubrik terkunci setelah ada lembar nilai untuk lomba itu.
 */
class RubricStatus
{
    public function totalWeight(Competition $competition): int
    {
        return (int) RubricCriterion::query()
            ->where('competition_id', $competition->id)
            ->sum('weight');
    }

    public function isReady(Competition $competition): bool
    {
        $criteria = RubricCriterion::query()->where('competition_id', $competition->id)->count();

        return $criteria > 0 && $this->totalWeight($competition) === 100;
    }

    public function isLocked(Competition $competition): bool
    {
        return $competition->scoreSheets()->exists();
    }

    /**
     * @return array{total_weight: int, criteria_count: int, is_ready: bool, is_locked: bool, message: string|null}
     */
    public function summary(Competition $competition): array
    {
        $count = RubricCriterion::query()->where('competition_id', $competition->id)->count();
        $total = $this->totalWeight($competition);
        $ready = $count > 0 && $total === 100;

        return [
            'total_weight' => $total,
            'criteria_count' => $count,
            'is_ready' => $ready,
            'is_locked' => $this->isLocked($competition),
            'message' => $this->message($count, $total, $ready),
        ];
    }

    private function message(int $count, int $total, bool $ready): ?string
    {
        if ($count === 0) {
            return 'Rubrik belum memiliki kriteria.';
        }

        if ($ready) {
            return null;
        }

        $diff = 100 - $total;

        return $diff > 0
            ? "Total bobot {$total} dari 100 — kurang {$diff}."
            : "Total bobot {$total} melebihi 100 — lebih ".abs($diff).'.';
    }
}

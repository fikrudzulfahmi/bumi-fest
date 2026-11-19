<?php

namespace App\Actions\Judge;

use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\RubricCriterion;
use App\Services\Scoring\RubricStatus;
use Illuminate\Support\Facades\DB;

/**
 * AC-F10-04: simpan kriteria rubrik (bobot bulat ≥ 1).
 * AC-F10-05: rubrik terkunci setelah ada lembar nilai untuk lomba itu.
 *
 * Simpan = ganti seluruh kriteria lomba (form menyajikan daftar penuh),
 * sehingga urutan `sort` selalu mengikuti urutan kiriman.
 */
class SaveRubric
{
    public function __construct(private readonly RubricStatus $status) {}

    /**
     * @param  array<int, array{name: string, weight: int, max_score: int}>  $criteria
     */
    public function handle(Competition $competition, array $criteria): void
    {
        if ($this->status->isLocked($competition)) {
            throw new BusinessRuleViolation(
                'Rubrik terkunci karena sudah ada lembar nilai. Hubungi admin lain bila perlu perubahan.',
            );
        }

        if ($criteria === []) {
            throw new BusinessRuleViolation('Rubrik harus memiliki minimal satu kriteria.');
        }

        foreach ($criteria as $index => $criterion) {
            if ($criterion['weight'] < 1) {
                throw new BusinessRuleViolation(
                    'Bobot kriteria ke-'.($index + 1).' harus bilangan bulat minimal 1.',
                );
            }

            if ($criterion['max_score'] < 1) {
                throw new BusinessRuleViolation(
                    'Nilai maksimal kriteria ke-'.($index + 1).' harus minimal 1.',
                );
            }
        }

        DB::transaction(function () use ($competition, $criteria): void {
            RubricCriterion::query()->where('competition_id', $competition->id)->delete();

            foreach (array_values($criteria) as $index => $criterion) {
                RubricCriterion::create([
                    'competition_id' => $competition->id,
                    'name' => $criterion['name'],
                    'weight' => $criterion['weight'],
                    'max_score' => $criterion['max_score'],
                    'sort' => $index + 1,
                ]);
            }
        });
    }
}

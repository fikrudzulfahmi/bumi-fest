<?php

namespace App\Actions\Scoring;

use App\Enums\ScoreSheetStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Registration;
use App\Models\RubricCriterion;
use App\Models\ScoreSheet;
use App\Models\User;
use App\Services\Scoring\FinalScoreCalculator;
use App\Services\Scoring\RubricStatus;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * AC-F11-04: kunci lembar nilai. Semua kriteria rubrik wajib terisi.
 * Total dihitung saat kunci (BR-12) dan tidak bisa diubah juri lagi.
 */
class LockScoreSheet
{
    public function __construct(
        private readonly SaveScoreSheet $save,
        private readonly RubricStatus $rubric,
        private readonly FinalScoreCalculator $calculator,
    ) {}

    public function handle(User $judge, Registration $registration): ScoreSheet
    {
        $competition = $registration->competition;

        if ($competition === null) {
            throw new BusinessRuleViolation('Entri tidak memiliki lomba.');
        }

        $this->save->assertAssigned($judge, $competition);

        if (! $this->rubric->isReady($competition)) {
            throw new BusinessRuleViolation('Rubrik lomba belum siap (total bobot harus 100).');
        }

        $sheet = ScoreSheet::query()
            ->where('registration_id', $registration->id)
            ->where('judge_id', $judge->id)
            ->with('scores')
            ->first();

        if ($sheet === null) {
            throw new BusinessRuleViolation('Belum ada nilai yang disimpan pada entri ini.');
        }

        if ($sheet->status === ScoreSheetStatus::Locked) {
            throw new BusinessRuleViolation('Lembar nilai sudah dikunci.');
        }

        /** @var Collection<int, RubricCriterion> $criteria */
        $criteria = $competition->rubricCriteria()->get();

        $filled = $sheet->scores->pluck('criterion_id')->unique();
        $missing = $criteria->reject(fn (RubricCriterion $c) => $filled->contains($c->id));

        if ($missing->isNotEmpty()) {
            $names = $missing->pluck('name')->implode(', ');

            throw new BusinessRuleViolation("Semua kriteria wajib dinilai sebelum dikunci. Kosong: {$names}.");
        }

        $total = $this->calculator->sheetTotal($criteria, $sheet);

        if ($total === null) {
            throw new BusinessRuleViolation('Nilai belum lengkap sehingga total tidak bisa dihitung.');
        }

        DB::transaction(function () use ($sheet, $total): void {
            $sheet->forceFill([
                'status' => ScoreSheetStatus::Locked,
                'total' => $total,
                'locked_at' => now(),
            ])->save();
        });

        activity()
            ->performedOn($sheet)
            ->withProperties(['status' => 'locked', 'total' => $total])
            ->log('Lembar nilai dikunci');

        return $sheet->refresh();
    }
}

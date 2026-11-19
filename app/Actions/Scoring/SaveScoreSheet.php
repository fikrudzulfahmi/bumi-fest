<?php

namespace App\Actions\Scoring;

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\ScoreSheetStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\RubricCriterion;
use App\Models\Score;
use App\Models\ScoreSheet;
use App\Models\User;
use App\Services\Scoring\RubricStatus;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * AC-F11-02/03/04: simpan draf nilai satu lembar.
 * Hanya entri `verified`, hanya juri yang ditugaskan, rubrik harus siap,
 * nilai 0..max, dan lembar terkunci tidak bisa diubah.
 */
class SaveScoreSheet
{
    public function __construct(private readonly RubricStatus $rubric) {}

    /**
     * @param  array<int, array{criterion_id: int, value: float|int|string|null}>  $scores
     */
    public function handle(User $judge, Registration $registration, array $scores, ?string $note = null): ScoreSheet
    {
        $competition = $registration->competition;

        if ($competition === null) {
            throw new BusinessRuleViolation('Entri tidak memiliki lomba.');
        }

        $this->assertAssigned($judge, $competition);

        if ($registration->status !== RegistrationStatus::Verified) {
            throw new BusinessRuleViolation('Hanya entri terverifikasi yang bisa dinilai.');
        }

        if (! $this->rubric->isReady($competition)) {
            throw new BusinessRuleViolation(
                'Rubrik lomba belum siap (total bobot harus 100). Penilaian ditutup sampai rubrik diperbaiki admin.',
            );
        }

        /** @var Collection<int, RubricCriterion> $criteria */
        $criteria = $competition->rubricCriteria()->get()->keyBy('id');

        $clean = [];

        foreach ($scores as $row) {
            $criterion = $criteria->get((int) $row['criterion_id']);

            if ($criterion === null) {
                throw new BusinessRuleViolation('Kriteria tidak dikenal pada rubrik lomba ini.');
            }

            if ($row['value'] === null || $row['value'] === '') {
                continue;
            }

            $value = round((float) $row['value'], 2, PHP_ROUND_HALF_UP);

            if ($value < 0 || $value > $criterion->max_score) {
                throw new BusinessRuleViolation(
                    "Nilai kriteria \"{$criterion->name}\" harus antara 0 dan {$criterion->max_score}.",
                );
            }

            $clean[$criterion->id] = $value;
        }

        return DB::transaction(function () use ($registration, $judge, $clean, $note): ScoreSheet {
            $sheet = ScoreSheet::query()->firstOrNew([
                'registration_id' => $registration->id,
                'judge_id' => $judge->id,
            ]);

            if ($sheet->exists && $sheet->status === ScoreSheetStatus::Locked) {
                throw new BusinessRuleViolation('Lembar nilai sudah dikunci. Hubungi admin bila perlu dibuka.');
            }

            $sheet->fill([
                'note' => $note,
                'status' => ScoreSheetStatus::Draft,
            ])->save();

            Score::query()->where('score_sheet_id', $sheet->id)->delete();

            foreach ($clean as $criterionId => $value) {
                Score::query()->create([
                    'score_sheet_id' => $sheet->id,
                    'criterion_id' => $criterionId,
                    'value' => $value,
                ]);
            }

            return $sheet->refresh()->load('scores');
        });
    }

    public function assertAssigned(User $judge, Competition $competition): void
    {
        if ($judge->role !== Role::Judge) {
            throw new BusinessRuleViolation('Hanya juri yang bisa menilai.');
        }

        $assigned = $competition->judgeAssignments()
            ->where('judge_id', $judge->id)
            ->exists();

        if (! $assigned) {
            throw new BusinessRuleViolation('Anda tidak ditugaskan pada lomba ini.');
        }
    }
}

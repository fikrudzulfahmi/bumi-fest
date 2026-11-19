<?php

namespace App\Http\Controllers\Judge;

use App\Actions\Scoring\LockScoreSheet;
use App\Actions\Scoring\SaveScoreSheet;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Judge\StoreScoreRequest;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\RubricCriterion;
use App\Models\ScoreSheet;
use App\Services\Scoring\RubricStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScoreSheetController extends Controller
{
    /**
     * AC-F11-01: form penilaian satu entri, hanya untuk juri yang ditugaskan.
     */
    public function edit(Request $request, Registration $registration): Response
    {
        $judge = $request->user();
        $competition = $registration->competition;

        abort_if($competition === null, 404);
        abort_unless($this->assigned($competition, (int) $judge->id), 403);
        abort_unless($registration->status === RegistrationStatus::Verified, 404);

        $registration->load('members.participant');

        $criteria = $competition->rubricCriteria()->get();

        $sheet = ScoreSheet::query()
            ->where('registration_id', $registration->id)
            ->where('judge_id', $judge->id)
            ->with('scores')
            ->first();

        $values = $sheet?->scores->mapWithKeys(
            fn ($score) => [$score->criterion_id => (float) $score->value],
        )->all() ?? [];

        return Inertia::render('judge/ScoreSheet', [
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'level_label' => Level::tryFrom($competition->level)?->label(),
                'results_published_at' => $competition->results_published_at?->toIso8601String(),
            ],
            'entry' => [
                'id' => $registration->id,
                'code' => $registration->code,
                'team_name' => $registration->team_name,
                'names' => $registration->members
                    ->map(fn ($member) => $member->participant?->name)
                    ->filter()
                    ->values()
                    ->all(),
                'school_name' => $registration->members
                    ->map(fn ($member) => $member->participant?->school_name)
                    ->filter()
                    ->first(),
                'submission_url' => $registration->submission_url,
                'submission_name' => $registration->submission_name,
            ],
            'criteria' => $criteria->map(fn (RubricCriterion $criterion) => [
                'id' => $criterion->id,
                'name' => $criterion->name,
                'weight' => $criterion->weight,
                'max_score' => $criterion->max_score,
            ])->values(),
            'sheet' => $sheet === null ? null : [
                'status' => $sheet->status->value,
                'status_label' => $sheet->status->label(),
                'total' => $sheet->total !== null ? (float) $sheet->total : null,
                'note' => $sheet->note,
                'locked_at' => $sheet->locked_at?->toIso8601String(),
                'values' => $values,
            ],
            'rubric' => app(RubricStatus::class)->summary($competition),
        ]);
    }

    /**
     * AC-F11-03/04: simpan draf nilai.
     */
    public function update(
        StoreScoreRequest $request,
        Registration $registration,
        SaveScoreSheet $action,
    ): RedirectResponse {
        try {
            $action->handle(
                $request->user(),
                $registration,
                $request->validated()['scores'],
                $request->validated()['note'] ?? null,
            );
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Nilai tersimpan sebagai draf. Kunci lembar bila sudah final.');
    }

    /**
     * AC-F11-04: kunci lembar nilai.
     */
    public function lock(
        Request $request,
        Registration $registration,
        LockScoreSheet $action,
    ): RedirectResponse {
        try {
            $action->handle($request->user(), $registration);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Lembar nilai dikunci. Total sudah dihitung dan tidak bisa diubah.');
    }

    private function assigned(Competition $competition, int $judgeId): bool
    {
        return $competition->judgeAssignments()->where('judge_id', $judgeId)->exists();
    }
}

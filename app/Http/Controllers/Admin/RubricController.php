<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Judge\SaveRubric;
use App\Enums\Level;
use App\Exceptions\BusinessRuleViolation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveRubricRequest;
use App\Models\Competition;
use App\Services\Scoring\RubricStatus;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RubricController extends Controller
{
    public function edit(Competition $competition, RubricStatus $status): Response
    {
        $competition->load(['rubricCriteria']);

        return Inertia::render('admin/rubrics/Edit', [
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'level' => $competition->level,
                'level_label' => Level::tryFrom($competition->level)?->label(),
            ],
            'criteria' => $competition->rubricCriteria->map(fn ($criterion) => [
                'id' => $criterion->id,
                'name' => $criterion->name,
                'weight' => $criterion->weight,
                'max_score' => $criterion->max_score,
            ])->values(),
            'rubric' => $status->summary($competition),
        ]);
    }

    /**
     * AC-F10-04: bobot bulat ≥ 1, rubrik siap bila total 100.
     * AC-F10-05: tolak perubahan setelah ada lembar nilai.
     */
    public function update(SaveRubricRequest $request, Competition $competition, SaveRubric $action): RedirectResponse
    {
        /** @var array<int, array{name: string, weight: int, max_score: int}> $criteria */
        $criteria = $request->validated('criteria');

        try {
            $action->handle($competition, $criteria);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Rubrik lomba '.$competition->name.' disimpan.');
    }
}

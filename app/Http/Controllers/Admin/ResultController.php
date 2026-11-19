<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Scoring\ComputeFinalScores;
use App\Actions\Scoring\PublishResults;
use App\Actions\Scoring\SetPlacements;
use App\Actions\Scoring\UnlockScoreSheet;
use App\Enums\Level;
use App\Exceptions\BusinessRuleViolation;
use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\ScoreSheet;
use App\Services\Scoring\ResultRows;
use App\Services\Scoring\RubricStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResultController extends Controller
{
    public function index(Competition $competition, ResultRows $rows, RubricStatus $rubric): Response
    {
        $computed = $rows->forCompetition($competition);

        return Inertia::render('admin/results/Index', [
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'slug' => $competition->slug,
                'level_label' => Level::tryFrom($competition->level)?->label(),
                'results_published_at' => $competition->results_published_at?->toIso8601String(),
            ],
            'rows' => $computed,
            'suggestions' => $rows->suggestions($computed),
            'rubric' => $rubric->summary($competition),
            'judges' => $competition->judgeAssignments()
                ->with('judge')
                ->get()
                ->map(fn ($assignment) => [
                    'id' => $assignment->judge->id,
                    'name' => $assignment->judge->name,
                ])
                ->filter()
                ->values(),
            'sheets' => ScoreSheet::query()
                ->whereIn('registration_id', $competition->registrations()->select('id'))
                ->with(['judge', 'registration'])
                ->get()
                ->map(fn (ScoreSheet $sheet) => [
                    'id' => $sheet->id,
                    'judge_name' => $sheet->judge->name,
                    'registration_code' => $sheet->registration->code,
                    'status' => $sheet->status->value,
                    'status_label' => $sheet->status->label(),
                    'total' => $sheet->total !== null ? (float) $sheet->total : null,
                    'locked_at' => $sheet->locked_at?->toIso8601String(),
                ])
                ->values(),
        ]);
    }

    public function unlock(ScoreSheet $sheet, UnlockScoreSheet $action): RedirectResponse
    {
        try {
            $action->handle($sheet);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Lembar nilai dibuka. Juri bisa memperbaiki nilai.');
    }

    public function unlockAll(Request $request, Competition $competition, UnlockScoreSheet $action): RedirectResponse
    {
        try {
            $action->handleCompetition($competition);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Semua lembar nilai dibuka untuk perbaikan.');
    }

    public function compute(Competition $competition, ComputeFinalScores $action): RedirectResponse
    {
        $count = $action->handle($competition);

        return back()->with('success', "Nilai akhir {$count} entri dihitung ulang.");
    }

    public function placements(Request $request, Competition $competition, SetPlacements $action): RedirectResponse
    {
        $validated = $request->validate([
            'placements' => ['required', 'array', 'min:1', 'max:3'],
            'placements.*' => ['required', 'integer', 'min:1', 'max:3'],
        ]);

        /** @var array<int, int> $placements */
        $placements = $validated['placements'];

        try {
            $action->handle($competition, $placements);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Juara ditetapkan. Terbitkan hasil agar tampil di portal.');
    }

    public function publish(Request $request, Competition $competition, PublishResults $action): RedirectResponse
    {
        $allowIncomplete = $request->boolean('allow_incomplete');

        try {
            $action->handle($competition, $allowIncomplete);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Hasil lomba diterbitkan. Peserta mendapat notifikasi.');
    }
}

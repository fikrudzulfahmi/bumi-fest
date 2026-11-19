<?php

namespace App\Http\Controllers\Judge;

use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Enums\ScoreSheetStatus;
use App\Http\Controllers\Controller;
use App\Models\JudgeAssignment;
use App\Models\ScoreSheet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * AC-F10-06: juri hanya melihat lomba yang ditugaskan kepadanya.
     * Progres dihitung dari entri `verified` pada lomba itu.
     */
    public function __invoke(Request $request): Response
    {
        $judge = $request->user();

        $assignments = JudgeAssignment::query()
            ->where('judge_id', $judge->id)
            ->with(['competition:id,name,level,slug'])
            ->get()
            ->map(function (JudgeAssignment $assignment) use ($judge): array {
                $competition = $assignment->competition;

                // AC-F10-06: penyebut = entri terverifikasi lomba ini.
                $entryIds = $competition->registrations()
                    ->where('status', RegistrationStatus::Verified)
                    ->pluck('id');

                $total = $entryIds->count();

                $sheets = ScoreSheet::query()
                    ->where('judge_id', $judge->id)
                    ->whereIn('registration_id', $entryIds);

                $locked = (clone $sheets)->where('status', ScoreSheetStatus::Locked)->count();
                $drafted = (clone $sheets)->where('status', ScoreSheetStatus::Draft)->count();

                return [
                    'id' => $assignment->id,
                    'competition' => [
                        'id' => $competition->id,
                        'name' => $competition->name,
                        'level' => $competition->level,
                        'level_label' => Level::tryFrom($competition->level)?->label(),
                        'slug' => $competition->slug,
                    ],
                    'entries_total' => $total,
                    'entries_locked' => $locked,
                    'entries_drafted' => $drafted,
                    'entries_remaining' => max(0, $total - $locked - $drafted),
                    'progress_percent' => $total > 0 ? (int) round($locked / $total * 100) : 0,
                ];
            })
            ->values();

        return Inertia::render('judge/Dashboard', [
            'assignments' => $assignments,
        ]);
    }
}

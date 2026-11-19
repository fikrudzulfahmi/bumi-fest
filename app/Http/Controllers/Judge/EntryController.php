<?php

namespace App\Http\Controllers\Judge;

use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Enums\ScoreSheetStatus;
use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\ScoreSheet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EntryController extends Controller
{
    /**
     * AC-F11-01/02: daftar entri lomba yang ditugaskan ke juri ini.
     */
    public function index(Request $request, Competition $competition): Response
    {
        $judge = $request->user();

        abort_unless($this->assigned($competition, (int) $judge->id), 403);

        $sheets = ScoreSheet::query()
            ->where('judge_id', $judge->id)
            ->whereIn('registration_id', $competition->registrations()->select('id'))
            ->get()
            ->keyBy('registration_id');

        $registrations = Registration::query()
            ->where('competition_id', $competition->id)
            ->where('status', RegistrationStatus::Verified)
            ->with(['members.participant'])
            ->orderBy('code')
            ->get()
            ->map(function (Registration $registration) use ($sheets): array {
                /** @var ScoreSheet|null $sheet */
                $sheet = $sheets->get($registration->id);

                return [
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
                    'status' => $sheet?->status->value,
                    'status_label' => $sheet?->status->label(),
                    'total' => $sheet?->total !== null ? (float) $sheet->total : null,
                ];
            });

        return Inertia::render('judge/Entries', [
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'level_label' => Level::tryFrom($competition->level)?->label(),
            ],
            'entries' => $registrations,
            'counts' => [
                'total' => $registrations->count(),
                'done' => $registrations->where('status', ScoreSheetStatus::Locked->value)->count(),
            ],
        ]);
    }

    private function assigned(Competition $competition, int $judgeId): bool
    {
        return $competition->judgeAssignments()->where('judge_id', $judgeId)->exists();
    }
}

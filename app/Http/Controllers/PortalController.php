<?php

namespace App\Http\Controllers;

use App\Enums\Level;
use App\Models\Announcement;
use App\Models\Competition;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('portal/Index', [
            'levels' => [
                ['slug' => Level::SdMi->slug(), 'label' => Level::SdMi->label()],
                ['slug' => Level::SmpMts->slug(), 'label' => Level::SmpMts->label()],
            ],
        ]);
    }

    public function level(Request $request, string $slug): Response|RedirectResponse
    {
        $level = Level::fromSlug($slug);

        if (! $level) {
            abort(404);
        }

        // Simpan pilihan
        $request->user()->update(['preferred_level' => $level->value]);

        $now = now('Asia/Jakarta');

        // Ambil lomba published jenjang ini
        $competitions = Competition::query()
            ->byLevel($level->value)
            ->published()
            ->with([])
            ->orderBy('opens_at', 'desc')
            ->get()
            ->map(function (Competition $competition) use ($now) {
                return [
                    'id' => $competition->id,
                    'name' => $competition->name,
                    'slug' => $competition->slug,
                    'category' => $competition->category,
                    'fee' => $competition->fee,
                    'opens_at' => $competition->opens_at,
                    'closes_at' => $competition->closes_at,
                    'quota' => $competition->quota,
                    'status' => $this->computeStatus($competition, $now),
                    'results_published_at' => $competition->results_published_at?->toIso8601String(),
                ];
            });

        // Ambil pengumuman: umum (level=null) + jenjang ini (level=$level->value)
        $announcements = Announcement::query()
            ->published()
            ->forLevel($level->value)
            ->orderBy('published_at', 'desc')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'published_at' => $a->published_at,
            ]);

        return Inertia::render('portal/Level', [
            'level' => ['slug' => $level->slug(), 'label' => $level->label()],
            'competitions' => $competitions,
            'announcements' => $announcements,
        ]);
    }

    /**
     * AC-F11-11: daftar juara tampil di portal hanya setelah hasil terbit.
     */
    public function results(string $slug, Competition $competition): Response
    {
        $level = Level::fromSlug($slug);

        abort_if($level === null, 404);
        abort_unless($competition->level === $level->value, 404);
        abort_if($competition->results_published_at === null, 404);

        $winners = $competition->registrations()
            ->whereNotNull('placement')
            ->with(['members.participant'])
            ->orderBy('placement')
            ->orderBy('code')
            ->get()
            ->map(fn ($registration) => [
                'id' => $registration->id,
                'code' => $registration->code,
                'team_name' => $registration->team_name,
                'placement' => $registration->placement,
                'names' => $registration->members
                    ->map(fn ($member) => $member->participant?->name)
                    ->filter()
                    ->values()
                    ->all(),
                'school_name' => $registration->members
                    ->map(fn ($member) => $member->participant?->school_name)
                    ->filter()
                    ->first(),
            ]);

        return Inertia::render('portal/Results', [
            'level' => ['slug' => $level->slug(), 'label' => $level->label()],
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'slug' => $competition->slug,
                'results_published_at' => $competition->results_published_at->toIso8601String(),
            ],
            'winners' => $winners,
        ]);
    }

    private function computeStatus(Competition $competition, Carbon $now): string
    {
        // BR-02 & BR-03: Dibuka, Segera dibuka, Ditutup, Kuota penuh
        if ($now < $competition->opens_at) {
            return 'Segera dibuka';
        }

        if ($now > $competition->closes_at) {
            return 'Ditutup';
        }

        if ($competition->quota !== null && $competition->quota <= 0) {
            return 'Kuota penuh';
        }

        return 'Dibuka';
    }
}

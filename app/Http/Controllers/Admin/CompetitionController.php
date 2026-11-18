<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Competition\ArchiveCompetition;
use App\Actions\Competition\DeleteCompetition;
use App\Actions\Competition\DuplicateCompetition;
use App\Actions\Competition\PublishCompetition;
use App\Actions\Competition\StoreCompetition;
use App\Actions\Competition\UpdateCompetition;
use App\Enums\Level;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompetitionRequest;
use App\Http\Requests\UpdateCompetitionRequest;
use App\Http\Resources\CompetitionResource;
use App\Models\Competition;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CompetitionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $query = Competition::query();

        if (request('level')) {
            $query->where('level', request('level'));
        }

        if (request('status')) {
            $query->where('status', request('status'));
        }

        if (request('search')) {
            $query->where('name', 'like', '%'.request('search').'%')
                ->orWhere('slug', 'like', '%'.request('search').'%');
        }

        $competitions = $query
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('admin/competitions/Index', [
            'competitions' => CompetitionResource::collection($competitions),
            'filters' => [
                'level' => request('level'),
                'status' => request('status'),
                'search' => request('search'),
            ],
            'levels' => collect(Level::cases())->map(fn ($level) => [
                'value' => $level->value,
                'label' => $level->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/competitions/Create', [
            'levels' => collect(Level::cases())->map(fn ($level) => [
                'value' => $level->value,
                'label' => $level->label(),
            ]),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCompetitionRequest $request): RedirectResponse
    {
        $competition = (new StoreCompetition)->handle($request->validated());

        return redirect()
            ->route('admin.competitions.show', $competition)
            ->with('success', 'Lomba berhasil dibuat.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Competition $competition): Response
    {
        return Inertia::render('admin/competitions/Show', [
            'competition' => CompetitionResource::make($competition),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Competition $competition): Response
    {
        return Inertia::render('admin/competitions/Edit', [
            'competition' => CompetitionResource::make($competition),
            'levels' => collect(Level::cases())->map(fn ($level) => [
                'value' => $level->value,
                'label' => $level->label(),
            ]),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCompetitionRequest $request, Competition $competition): RedirectResponse
    {
        (new UpdateCompetition)->handle($competition, $request->validated());

        return redirect()
            ->route('admin.competitions.show', $competition)
            ->with('success', 'Lomba berhasil diperbarui.');
    }

    /**
     * Remove the resource from storage.
     */
    public function destroy(Competition $competition): RedirectResponse
    {
        (new DeleteCompetition)->handle($competition);

        return redirect()
            ->route('admin.competitions.index')
            ->with('success', 'Lomba berhasil dihapus.');
    }

    /**
     * Publish the competition.
     */
    public function publish(Competition $competition): RedirectResponse
    {
        (new PublishCompetition)->handle($competition);

        return redirect()
            ->route('admin.competitions.show', $competition)
            ->with('success', 'Lomba berhasil dipublikasikan.');
    }

    /**
     * Archive the competition.
     */
    public function archive(Competition $competition): RedirectResponse
    {
        (new ArchiveCompetition)->handle($competition);

        return redirect()
            ->route('admin.competitions.show', $competition)
            ->with('success', 'Lomba berhasil diarsipkan.');
    }

    /**
     * Duplicate the competition.
     */
    public function duplicate(Competition $competition): RedirectResponse
    {
        $copy = (new DuplicateCompetition)->handle($competition);

        return redirect()
            ->route('admin.competitions.show', $copy)
            ->with('success', 'Lomba berhasil disalin.');
    }
}

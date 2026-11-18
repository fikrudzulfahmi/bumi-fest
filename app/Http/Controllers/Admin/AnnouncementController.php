<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Level;
use App\Http\Controllers\Controller;
use App\Http\Requests\AnnouncementRequest;
use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/announcements/Index', [
            'announcements' => Announcement::with('author')
                ->orderBy('published_at', 'desc')
                ->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/announcements/Create', [
            'levels' => collect(Level::cases())->map(fn ($l) => [
                'value' => $l->value,
                'label' => $l->label(),
            ]),
        ]);
    }

    public function store(AnnouncementRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            Announcement::create($request->validated() + [
                'author_id' => $request->user()->id,
            ]);
        });

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil dibuat.');
    }

    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('admin/announcements/Edit', [
            'announcement' => $announcement,
            'levels' => collect(Level::cases())->map(fn ($l) => [
                'value' => $l->value,
                'label' => $l->label(),
            ]),
        ]);
    }

    public function update(AnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        DB::transaction(function () use ($request, $announcement) {
            $announcement->update($request->validated());
        });

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        DB::transaction(fn () => $announcement->delete());

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil dihapus.');
    }

    public function publish(Announcement $announcement): RedirectResponse
    {
        DB::transaction(fn () => $announcement->update(['published_at' => now('Asia/Jakarta')]));

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil diterbitkan.');
    }

    public function unpublish(Announcement $announcement): RedirectResponse
    {
        DB::transaction(fn () => $announcement->update(['published_at' => null]));

        return redirect()->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil ditarik.');
    }
}

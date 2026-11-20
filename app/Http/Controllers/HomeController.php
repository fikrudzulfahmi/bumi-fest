<?php

namespace App\Http\Controllers;

use App\Enums\Level;
use App\Models\Competition;
use App\Services\Settings\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * F02 — beranda publik `/`: nama acara dari pengaturan, jadwal ringkas,
 * dan tombol Masuk / Daftar Akun. Tidak butuh login.
 */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $competitions = Competition::query()
            ->published()
            ->orderBy('opens_at')
            ->get()
            ->map(fn (Competition $competition) => [
                'id' => $competition->id,
                'name' => $competition->name,
                'level' => $competition->level,
                'level_label' => Level::tryFrom($competition->level)?->label(),
                'category' => $competition->category,
                'fee' => $competition->fee,
                'opens_at' => $competition->opens_at->toIso8601String(),
                'closes_at' => $competition->closes_at->toIso8601String(),
            ]);

        return Inertia::render('public/Home', [
            'event_name' => (string) Settings::get('event_name', 'Bumi Fest'),
            'contact_email' => (string) Settings::get('contact_email', ''),
            'contact_whatsapp' => (string) Settings::get('contact_whatsapp', ''),
            'competitions' => $competitions,
            'can_login' => $request->user() === null,
        ]);
    }
}

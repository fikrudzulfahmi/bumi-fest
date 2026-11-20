<?php

namespace App\Http\Controllers;

use App\Enums\Level;
use App\Models\Competition;
use App\Models\Registration;
use App\Services\Settings\Settings;
use Carbon\Carbon;
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
        $now = now('Asia/Jakarta');

        $competitions = Competition::query()
            ->published()
            ->orderBy('opens_at')
            ->get()
            ->map(fn (Competition $competition) => [
                'id' => $competition->id,
                'name' => $competition->name,
                'slug' => $competition->slug,
                'level' => $competition->level,
                'level_label' => Level::tryFrom($competition->level)?->label(),
                'category' => $competition->category,
                'fee' => $competition->fee,
                'quota' => $competition->quota,
                'opens_at' => $competition->opens_at->toIso8601String(),
                'closes_at' => $competition->closes_at->toIso8601String(),
                'status' => $this->computeStatus($competition, $now),
            ]);

        return Inertia::render('public/Home', [
            'event_name' => (string) Settings::get('event_name', 'Bumifest'),
            'contact_email' => (string) Settings::get('contact_email', ''),
            'contact_whatsapp' => (string) Settings::get('contact_whatsapp', ''),
            'competitions' => $competitions,
            'stats' => [
                'total_competitions' => $competitions->count(),
                'total_registrations' => Registration::query()
                    ->whereNotIn('status', ['draft', 'cancelled'])
                    ->count(),
                'levels' => count(Level::cases()),
            ],
            'faqs' => $this->faqs(),
            'can_login' => $request->user() === null,
        ]);
    }

    /**
     * @return array<int, array{q: string, a: string}>
     */
    private function faqs(): array
    {
        $whatsapp = (string) Settings::get('contact_whatsapp', '');
        $email = (string) Settings::get('contact_email', '');

        $kontak = trim(implode(' atau ', array_filter([
            $whatsapp !== '' ? 'WhatsApp '.$whatsapp : null,
            $email !== '' ? $email : null,
        ])));

        return [
            [
                'q' => 'Siapa yang boleh ikut Bumifest?',
                'a' => 'Peserta dari jenjang SD/MI dan SMP/MTs sesuai ketentuan tiap cabang lomba. Detail syarat ada di halaman cabang.',
            ],
            [
                'q' => 'Apakah ada biaya pendaftaran?',
                'a' => 'Biaya mengikuti ketetapan panitia dan tercantum di kartu tiap cabang lomba. Sebagian cabang bisa gratis.',
            ],
            [
                'q' => 'Bagaimana tahu pendaftaran saya disetujui?',
                'a' => 'Status tampil di dasbor peserta: menunggu verifikasi, terverifikasi, atau ditolak beserta alasannya. Notifikasi juga dikirim lewat email.',
            ],
            [
                'q' => 'Kapan hasil lomba diumumkan?',
                'a' => 'Hasil tampil di halaman Hasil setelah panitia menerbitkannya. Sertifikat dapat diunduh setelah hasil terbit.',
            ],
            [
                'q' => 'Siapa yang bisa dihubungi jika ada kendala?',
                'a' => $kontak !== '' ? 'Hubungi panitia melalui '.$kontak.'.' : 'Hubungi panitia melalui kontak yang tertera di halaman pengumuman.',
            ],
        ];
    }

    private function computeStatus(Competition $competition, Carbon $now): string
    {
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

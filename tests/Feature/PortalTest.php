<?php

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\Competition;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(DatabaseSeeder::class);
});

function verifiedUser(Role $role = Role::Participant, ?string $level = null): User
{
    return User::factory()->create([
        'role' => $role->value,
        'email_verified_at' => now(),
        'is_active' => true,
        'preferred_level' => $level,
    ]);
}

describe('F02 — Portal Jenjang & Beranda', function () {
    test('AC-F02-01 /portal menampilkan dua pilihan jenjang', function () {
        $user = verifiedUser();

        $response = $this->actingAs($user)->get('/portal');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('portal/Index')
            ->has('levels', 2)
            ->where('levels.0.slug', 'sd-mi')
            ->where('levels.1.slug', 'smp-mts')
        );
    });

    test('AC-F02-02 level tidak dikenal return 404', function () {
        $user = verifiedUser();

        $response = $this->actingAs($user)->get('/portal/unknown-level');

        $response->assertNotFound();
    });

    test('AC-F02-03 hanya lomba published dengan level sama yang tampil', function () {
        $user = verifiedUser(level: 'sd_mi');

        Competition::factory()->published()->sdMi()->create(['name' => 'Lomba SD Published']);
        Competition::factory()->draft()->sdMi()->create(['name' => 'Lomba SD Draft']);
        Competition::factory()->published()->smpMts()->create(['name' => 'Lomba SMP Published']);

        $response = $this->actingAs($user)->get('/portal/sd-mi');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('portal/Level')
            ->has('competitions', 1)
            ->where('competitions.0.name', 'Lomba SD Published')
        );
    });

    test('AC-F02-04 empat status lomba dihitung benar', function () {
        $this->travelTo(Carbon::parse('2026-06-15 10:00:00', 'Asia/Jakarta'));

        $user = verifiedUser(level: 'sd_mi');

        // Dibuka: sekarang antara opens & closes, kuota ada
        Competition::factory()->published()->sdMi()->create([
            'name' => 'Lomba Dibuka',
            'opens_at' => Carbon::parse('2026-06-10 00:00:00', 'Asia/Jakarta'),
            'closes_at' => Carbon::parse('2026-06-20 23:59:59', 'Asia/Jakarta'),
            'quota' => 10,
        ]);

        // Segera dibuka: opens di masa depan
        Competition::factory()->published()->sdMi()->create([
            'name' => 'Lomba Segera',
            'opens_at' => Carbon::parse('2026-07-01 00:00:00', 'Asia/Jakarta'),
            'closes_at' => Carbon::parse('2026-07-10 23:59:59', 'Asia/Jakarta'),
            'quota' => 10,
        ]);

        // Ditutup: closes di masa lalu
        Competition::factory()->published()->sdMi()->create([
            'name' => 'Lomba Ditutup',
            'opens_at' => Carbon::parse('2026-05-01 00:00:00', 'Asia/Jakarta'),
            'closes_at' => Carbon::parse('2026-05-10 23:59:59', 'Asia/Jakarta'),
            'quota' => 10,
        ]);

        // Kuota penuh: kuota 0
        Competition::factory()->published()->sdMi()->create([
            'name' => 'Lomba Penuh',
            'opens_at' => Carbon::parse('2026-06-10 00:00:00', 'Asia/Jakarta'),
            'closes_at' => Carbon::parse('2026-06-20 23:59:59', 'Asia/Jakarta'),
            'quota' => 0,
        ]);

        $response = $this->actingAs($user)->get('/portal/sd-mi');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('portal/Level')
            ->has('competitions', 4)
        );

        $competitions = $response->viewData('page')['props']['competitions'];
        $statuses = collect($competitions)->pluck('status', 'name');

        expect($statuses['Lomba Dibuka'])->toBe('Dibuka');
        expect($statuses['Lomba Segera'])->toBe('Segera dibuka');
        expect($statuses['Lomba Ditutup'])->toBe('Ditutup');
        expect($statuses['Lomba Penuh'])->toBe('Kuota penuh');
    });

    test('AC-F02-05 pilihan jenjang tersimpan dan dipakai login berikutnya', function () {
        $user = verifiedUser();

        $this->actingAs($user)->get('/portal/sd-mi');

        $user->refresh();
        expect($user->preferred_level)->toBe('sd_mi');
    });

    test('AC-F02-06 judge/admin akses /portal return 403', function () {
        $judge = verifiedUser(Role::Judge);
        $admin = verifiedUser(Role::Admin);

        $this->actingAs($judge)->get('/portal')->assertForbidden();
        $this->actingAs($admin)->get('/portal')->assertForbidden();
        $this->actingAs($judge)->get('/portal/sd-mi')->assertForbidden();
        $this->actingAs($admin)->get('/portal/sd-mi')->assertForbidden();
    });

    test('AC-F02-07 pengumuman jenjang lain tidak tampil; pengumuman umum tampil', function () {
        $user = verifiedUser(level: 'sd_mi');

        Announcement::factory()->general()->create(['title' => 'Pengumuman Umum']);
        Announcement::factory()->sdMi()->create(['title' => 'Pengumuman SD']);
        Announcement::factory()->smpMts()->create(['title' => 'Pengumuman SMP']);

        $response = $this->actingAs($user)->get('/portal/sd-mi');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('portal/Level')
            ->has('announcements', 2)
        );

        $titles = collect($response->viewData('page')['props']['announcements'])->pluck('title');
        expect($titles)->toContain('Pengumuman Umum');
        expect($titles)->toContain('Pengumuman SD');
        expect($titles)->not->toContain('Pengumuman SMP');
    });

    test('AC-F02-08 beranda memuat tanpa N+1 (jumlah query dibatasi)', function () {
        $user = verifiedUser(level: 'sd_mi');

        // Buat 5 lomba published
        for ($i = 0; $i < 5; $i++) {
            Competition::factory()->published()->sdMi()->create();
        }

        // Buat 5 pengumuman
        for ($i = 0; $i < 5; $i++) {
            Announcement::factory()->general()->create();
        }

        $queryCount = 0;
        DB::listen(function () use (&$queryCount) {
            $queryCount++;
        });

        $this->actingAs($user)->get('/portal/sd-mi')->assertOk();

        // Query count harus < 20 (tanpa N+1 idealnya ~5-10 query)
        expect($queryCount)->toBeLessThan(20);
    });
});

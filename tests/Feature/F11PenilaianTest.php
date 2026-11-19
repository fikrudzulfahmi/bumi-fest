<?php

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\ScoreSheetStatus;
use App\Events\ResultsPublished;
use App\Jobs\GenerateCertificatesForCompetition;
use App\Models\Competition;
use App\Models\JudgeAssignment;
use App\Models\Registration;
use App\Models\RubricCriterion;
use App\Models\ScoreSheet;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => Role::Admin->value]);
    $this->competition = Competition::factory()->published()->create();
});

function f11Rubric(Competition $competition, int $weightA = 60, int $weightB = 40, int $maxA = 100, int $maxB = 100): array
{
    $a = RubricCriterion::factory()->create([
        'competition_id' => $competition->id,
        'name' => 'Kriteria A',
        'weight' => $weightA,
        'max_score' => $maxA,
        'sort' => 1,
    ]);
    $b = RubricCriterion::factory()->create([
        'competition_id' => $competition->id,
        'name' => 'Kriteria B',
        'weight' => $weightB,
        'max_score' => $maxB,
        'sort' => 2,
    ]);

    return [$a, $b];
}

function f11Judge(Competition $competition, ?string $email = null): User
{
    $judge = User::factory()->create([
        'role' => Role::Judge->value,
        'email' => $email ?? 'juri'.fake()->unique()->numberBetween(1, 99999).'@example.test',
        'email_verified_at' => now(),
    ]);

    JudgeAssignment::factory()->create([
        'judge_id' => $judge->id,
        'competition_id' => $competition->id,
    ]);

    return $judge;
}

function f11Entry(Competition $competition): Registration
{
    return Registration::factory()->create([
        'competition_id' => $competition->id,
        'status' => RegistrationStatus::Verified->value,
    ]);
}

function f11Participant(): User
{
    return User::factory()->create([
        'role' => Role::Participant->value,
        'email_verified_at' => now(),
    ]);
}

// AC-F11-01
it('AC-F11-01 juri hanya membuka lomba yang ditugaskan dan props tanpa data pembayaran', function () {
    [$a, $b] = f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $this->actingAs($judge)
        ->get(route('judge.entries', $this->competition->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('judge/Entries')
            ->has('entries', 1)
            ->missing('entries.0.invoice')
            ->missing('invoice'));

    $this->actingAs($judge)
        ->get(route('judge.scores.edit', $entry->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('judge/ScoreSheet')
            ->has('criteria', 2)
            ->missing('invoice'));

    $other = Competition::factory()->published()->create();
    $this->actingAs($judge)->get(route('judge.entries', $other->id))->assertForbidden();
});

// AC-F11-02
it('AC-F11-02 hanya entri terverifikasi yang muncul', function () {
    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);

    f11Entry($this->competition);
    Registration::factory()->create([
        'competition_id' => $this->competition->id,
        'status' => RegistrationStatus::AwaitingVerification->value,
    ]);
    Registration::factory()->create([
        'competition_id' => $this->competition->id,
        'status' => RegistrationStatus::Cancelled->value,
    ]);

    $this->actingAs($judge)
        ->get(route('judge.entries', $this->competition->id))
        ->assertInertia(fn ($page) => $page->has('entries', 1));
});

// AC-F11-03
it('AC-F11-03 nilai di luar rentang ditolak', function () {
    [$a, $b] = f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $this->actingAs($judge)
        ->put(route('judge.scores.update', $entry->id), [
            'scores' => [
                ['criterion_id' => $a->id, 'value' => 120],
                ['criterion_id' => $b->id, 'value' => 10],
            ],
        ])
        ->assertSessionHas('error');

    expect(ScoreSheet::query()->count())->toBe(0);
});

it('AC-F11-03 penilaian ditutup bila rubrik belum siap', function () {
    $criterion = RubricCriterion::factory()->create([
        'competition_id' => $this->competition->id,
        'name' => 'Tunggal',
        'weight' => 50,
        'max_score' => 100,
        'sort' => 1,
    ]);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $this->actingAs($judge)
        ->put(route('judge.scores.update', $entry->id), [
            'scores' => [['criterion_id' => $criterion->id, 'value' => 80]],
        ])
        ->assertSessionHas('error');
});

// AC-F11-04
it('AC-F11-04 draf bisa disimpan berulang, kunci menolak kriteria kosong, total benar', function () {
    [$a, $b] = f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $this->actingAs($judge)
        ->put(route('judge.scores.update', $entry->id), [
            'scores' => [['criterion_id' => $a->id, 'value' => 70]],
        ])
        ->assertSessionHas('success');

    // Draf kedua menimpa nilai sebelumnya, bukan menggandakan.
    $this->actingAs($judge)
        ->put(route('judge.scores.update', $entry->id), [
            'scores' => [
                ['criterion_id' => $a->id, 'value' => 80],
                ['criterion_id' => $b->id, 'value' => 50],
            ],
        ])
        ->assertSessionHas('success');

    $sheet = ScoreSheet::query()->where('registration_id', $entry->id)->firstOrFail();
    expect($sheet->status)->toBe(ScoreSheetStatus::Draft);
    expect($sheet->scores()->count())->toBe(2);
    expect((float) $sheet->scores()->where('criterion_id', $a->id)->value('value'))->toBe(80.0);

    // Kunci berhasil: 80/100*60 + 50/100*40 = 48 + 20 = 68.
    $this->actingAs($judge)
        ->post(route('judge.scores.lock', $entry->id))
        ->assertSessionHas('success');

    $sheet->refresh();
    expect($sheet->status)->toBe(ScoreSheetStatus::Locked);
    expect((float) $sheet->total)->toBe(68.0);
    expect($sheet->locked_at)->not->toBeNull();

    // AC-F11-04: setelah kunci, juri tidak bisa mengubah.
    $this->actingAs($judge)
        ->put(route('judge.scores.update', $entry->id), [
            'scores' => [
                ['criterion_id' => $a->id, 'value' => 10],
                ['criterion_id' => $b->id, 'value' => 10],
            ],
        ])
        ->assertSessionHas('error');

    expect((float) $sheet->fresh()->total)->toBe(68.0);
});

it('AC-F11-04 kunci ditolak bila ada kriteria kosong', function () {
    [$a, $b] = f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $this->actingAs($judge)
        ->put(route('judge.scores.update', $entry->id), [
            'scores' => [['criterion_id' => $a->id, 'value' => 80]],
        ]);

    $this->actingAs($judge)
        ->post(route('judge.scores.lock', $entry->id))
        ->assertSessionHas('error');

    expect(ScoreSheet::query()->firstOrFail()->status)->toBe(ScoreSheetStatus::Draft);
});

// AC-F11-05
it('AC-F11-05 admin membuka kunci menjadi draf dan total kosong', function () {
    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $sheet = ScoreSheet::factory()->create([
        'registration_id' => $entry->id,
        'judge_id' => $judge->id,
        'status' => ScoreSheetStatus::Locked->value,
        'total' => 68,
        'locked_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.results.unlock', $sheet->id))
        ->assertSessionHas('success');

    $sheet->refresh();
    expect($sheet->status)->toBe(ScoreSheetStatus::Draft);
    expect($sheet->total)->toBeNull();
    expect($sheet->locked_at)->toBeNull();
});

it('AC-F11-05 buka kunci ditolak setelah hasil terbit', function () {
    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $sheet = ScoreSheet::factory()->create([
        'registration_id' => $entry->id,
        'judge_id' => $judge->id,
        'status' => ScoreSheetStatus::Locked->value,
        'total' => 68,
        'locked_at' => now(),
    ]);

    $this->competition->forceFill(['results_published_at' => now()])->save();

    $this->actingAs($this->admin)
        ->post(route('admin.results.unlock', $sheet->id))
        ->assertSessionHas('error');

    expect($sheet->fresh()->status)->toBe(ScoreSheetStatus::Locked);
});

// AC-F11-06
it('AC-F11-06 nilai akhir menunggu semua juri terkunci lalu menjadi rata-rata', function () {
    [$a, $b] = f11Rubric($this->competition);
    $entry = f11Entry($this->competition);

    $judges = [f11Judge($this->competition), f11Judge($this->competition), f11Judge($this->competition)];

    $scores = [
        [90, 80], // 54 + 32 = 86
        [80, 60], // 48 + 24 = 72
        [70, 50], // 42 + 20 = 62
    ];

    // Dua juri terkunci, satu masih draf → nilai akhir belum ada.
    foreach ([0, 1] as $i) {
        $this->actingAs($judges[$i])->put(route('judge.scores.update', $entry->id), [
            'scores' => [
                ['criterion_id' => $a->id, 'value' => $scores[$i][0]],
                ['criterion_id' => $b->id, 'value' => $scores[$i][1]],
            ],
        ]);
        $this->actingAs($judges[$i])->post(route('judge.scores.lock', $entry->id));
    }
    $this->actingAs($judges[2])->put(route('judge.scores.update', $entry->id), [
        'scores' => [
            ['criterion_id' => $a->id, 'value' => $scores[2][0]],
            ['criterion_id' => $b->id, 'value' => $scores[2][1]],
        ],
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.results.index', $this->competition->id))
        ->assertInertia(fn ($page) => $page->where('rows.0.final_score', null));

    // Juri ketiga mengunci → rata-rata (86 + 72 + 62) / 3 = 73.33.
    $this->actingAs($judges[2])->post(route('judge.scores.lock', $entry->id));

    $this->actingAs($this->admin)
        ->get(route('admin.results.index', $this->competition->id))
        ->assertInertia(fn ($page) => $page->where('rows.0.final_score', 73.33));
});

// AC-F11-07
it('AC-F11-07 pembulatan dua desimal half-up', function () {
    [$a] = f11Rubric($this->competition, 100, 0, 8, 1);
    RubricCriterion::query()->where('name', 'Kriteria B')->delete();

    $entry = f11Entry($this->competition);
    $judge = f11Judge($this->competition);

    $this->actingAs($judge)->put(route('judge.scores.update', $entry->id), [
        'scores' => [['criterion_id' => $a->id, 'value' => 6.73]],
    ]);
    $this->actingAs($judge)->post(route('judge.scores.lock', $entry->id));

    $this->actingAs($this->admin)
        ->get(route('admin.results.index', $this->competition->id))
        ->assertInertia(fn ($page) => $page->where('rows.0.final_score', 84.13));
});

// AC-F11-08
it('AC-F11-08 peringkat terurut dan seri ditandai, juara 1-3 saja', function () {
    [$a, $b] = f11Rubric($this->competition);
    $judge = f11Judge($this->competition);

    $entries = [f11Entry($this->competition), f11Entry($this->competition), f11Entry($this->competition)];
    $values = [
        [90, 90, 90], // 90
        [80, 80, 80], // 80
        [80, 80, 80], // 80 — seri dengan entri kedua
    ];

    foreach ($entries as $index => $entry) {
        $this->actingAs($judge)->put(route('judge.scores.update', $entry->id), [
            'scores' => [
                ['criterion_id' => $a->id, 'value' => $values[$index][0]],
                ['criterion_id' => $b->id, 'value' => $values[$index][1]],
            ],
        ]);
        $this->actingAs($judge)->post(route('judge.scores.lock', $entry->id));
        $this->actingAs($this->admin)->post(route('admin.results.compute', $this->competition->id));
    }

    $this->actingAs($this->admin)
        ->get(route('admin.results.index', $this->competition->id))
        ->assertInertia(function ($page) {
            $page->where('rows.0.rank', 1)
                ->where('rows.1.rank', 2)
                ->where('rows.2.rank', 2)
                ->where('rows.1.is_tie', true)
                ->where('rows.2.is_tie', true);
        });

    $this->actingAs($this->admin)
        ->post(route('admin.results.placements', $this->competition->id), [
            'placements' => [$entries[0]->id => 1, $entries[1]->id => 2, $entries[2]->id => 2],
        ])
        ->assertSessionHas('success');

    expect($entries[0]->fresh()->placement)->toBe(1);
    expect($entries[2]->fresh()->placement)->toBe(2);

    $this->actingAs($this->admin)
        ->post(route('admin.results.placements', $this->competition->id), [
            'placements' => [$entries[0]->id => 4],
        ])
        ->assertSessionHasErrors();
});

// AC-F11-09
it('AC-F11-09 terbitkan diblokir bila ada entri tanpa nilai lengkap', function () {
    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    f11Entry($this->competition);
    $unscored = f11Entry($this->competition);

    $this->actingAs($this->admin)
        ->post(route('admin.results.publish', $this->competition->id), ['allow_incomplete' => false])
        ->assertSessionHas('error');

    expect($this->competition->fresh()->results_published_at)->toBeNull();

    // Dengan izin tanpa nilai lengkap → terbit, entri itu tanpa peringkat.
    $this->actingAs($this->admin)
        ->post(route('admin.results.publish', $this->competition->id), ['allow_incomplete' => true])
        ->assertSessionHas('success');

    expect($this->competition->fresh()->results_published_at)->not->toBeNull();

    $this->actingAs($this->admin)
        ->get(route('admin.results.index', $this->competition->id))
        ->assertInertia(fn ($page) => $page
            ->has('rows', 2)
            ->where('rows', fn ($rows) => collect($rows)->pluck('id')->contains($unscored->id)
                && collect($rows)->every(fn ($row) => $row['rank'] === null)));
});

// AC-F11-10
it('AC-F11-10 terbit mengisi waktu terbit, dispatch job sertifikat dan event', function () {
    Event::fake([ResultsPublished::class]);
    Queue::fake();

    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);
    [$a, $b] = RubricCriterion::query()->orderBy('sort')->get()->all();

    $this->actingAs($judge)->put(route('judge.scores.update', $entry->id), [
        'scores' => [
            ['criterion_id' => $a->id, 'value' => 90],
            ['criterion_id' => $b->id, 'value' => 90],
        ],
    ]);
    $this->actingAs($judge)->post(route('judge.scores.lock', $entry->id));

    $this->actingAs($this->admin)
        ->post(route('admin.results.publish', $this->competition->id), ['allow_incomplete' => false])
        ->assertSessionHas('success');

    expect($this->competition->fresh()->results_published_at)->not->toBeNull();
    Event::assertDispatched(ResultsPublished::class);
    Queue::assertPushed(GenerateCertificatesForCompetition::class);
});

// AC-F11-11
it('AC-F11-11 daftar juara portal hanya tampil setelah terbit', function () {
    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);
    $entry->forceFill(['placement' => 1])->save();
    [$a, $b] = RubricCriterion::query()->orderBy('sort')->get()->all();

    $this->actingAs($judge)->put(route('judge.scores.update', $entry->id), [
        'scores' => [
            ['criterion_id' => $a->id, 'value' => 90],
            ['criterion_id' => $b->id, 'value' => 90],
        ],
    ]);
    $this->actingAs($judge)->post(route('judge.scores.lock', $entry->id));

    $participant = f11Participant();
    $levelSlug = $this->competition->level === 'sd_mi' ? 'sd-mi' : 'smp-mts';

    $this->actingAs($participant)
        ->get(route('portal.results', ['level' => $levelSlug, 'competition' => $this->competition->slug]))
        ->assertNotFound();

    $this->actingAs($this->admin)
        ->post(route('admin.results.publish', $this->competition->id), ['allow_incomplete' => true]);

    $this->actingAs($participant)
        ->get(route('portal.results', ['level' => $levelSlug, 'competition' => $this->competition->slug]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('portal/Results')
            ->has('winners', 1)
            ->where('winners.0.placement', 1));
});

// AC-F11-12
it('AC-F11-12 peran lain tidak bisa membuka rute juri maupun hasil', function () {
    f11Rubric($this->competition);
    $judge = f11Judge($this->competition);
    $entry = f11Entry($this->competition);

    $participant = f11Participant();
    $institution = User::factory()->create([
        'role' => Role::Institution->value,
        'email_verified_at' => now(),
    ]);

    foreach ([$participant, $institution] as $user) {
        $this->actingAs($user)->get(route('judge.entries', $this->competition->id))->assertForbidden();
        $this->actingAs($user)->get(route('judge.scores.edit', $entry->id))->assertForbidden();
        $this->actingAs($user)->get(route('admin.results.index', $this->competition->id))->assertForbidden();
        $this->actingAs($user)
            ->post(route('admin.results.publish', $this->competition->id), ['allow_incomplete' => true])
            ->assertForbidden();
    }
});

<?php

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\ScoreSheetStatus;
use App\Models\Competition;
use App\Models\JudgeAssignment;
use App\Models\Registration;
use App\Models\RubricCriterion;
use App\Models\ScoreSheet;
use App\Models\User;
use App\Services\Scoring\RubricStatus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => Role::Admin->value]);
    $this->competition = Competition::factory()->published()->create();
});

function makeJudge(string $email = 'juri@example.test'): User
{
    return User::factory()->create([
        'role' => Role::Judge->value,
        'email' => $email,
        'email_verified_at' => now(),
    ]);
}

function makeVerifiedRegistration(Competition $competition): Registration
{
    return Registration::factory()->create([
        'competition_id' => $competition->id,
        'status' => RegistrationStatus::Verified->value,
    ]);
}

// AC-F10-01
it('admin membuat akun juri dan tautan atur kata sandi terkirim', function () {
    Password::shouldReceive('sendResetLink')
        ->once()
        ->with(['email' => 'juri.baru@example.test'])
        ->andReturn(Password::RESET_LINK_SENT);

    $response = $this->actingAs($this->admin)->post(route('admin.judges.store'), [
        'name' => 'Juri Baru',
        'email' => 'juri.baru@example.test',
        'whatsapp' => '081234567890',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $judge = User::query()->where('email', 'juri.baru@example.test')->firstOrFail();

    expect($judge->role)->toBe(Role::Judge);
    expect($judge->is_active)->toBeTrue();
    // AC-F10-01: akun buatan admin tidak perlu verifikasi email.
    expect($judge->email_verified_at)->not->toBeNull();
    // Kata sandi acak — tidak ada kata sandi yang bisa ditebak/dibagikan.
    expect($judge->password)->not->toBe(Hash::make('password'));
});

it('email juri duplikat ditolak', function () {
    makeJudge('sudah.ada@example.test');

    $response = $this->actingAs($this->admin)->post(route('admin.judges.store'), [
        'name' => 'Juri Kedua',
        'email' => 'sudah.ada@example.test',
    ]);

    $response->assertSessionHasErrors('email');
    expect(User::query()->where('email', 'sudah.ada@example.test')->count())->toBe(1);
});

// AC-F10-02
it('pendaftaran umum tidak bisa membuat juri', function () {
    $participant = User::factory()->create(['role' => Role::Participant->value]);

    $response = $this->actingAs($participant)->post(route('admin.judges.store'), [
        'name' => 'Juri Palsu',
        'email' => 'palsu@example.test',
    ]);

    $response->assertForbidden();
    expect(User::query()->where('email', 'palsu@example.test')->exists())->toBeFalse();
});

// AC-F10-03
it('penugasan juri unik per pasangan juri dan lomba', function () {
    $judge = makeJudge();
    $other = Competition::factory()->published()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.judges.assign', $judge->id), ['competition_id' => $this->competition->id])
        ->assertRedirect();
    expect(JudgeAssignment::query()->count())->toBe(1);

    // Penugasan kedua pada lomba yang sama → ditolak.
    $this->actingAs($this->admin)
        ->post(route('admin.judges.assign', $judge->id), ['competition_id' => $this->competition->id])
        ->assertSessionHas('error');
    expect(JudgeAssignment::query()->count())->toBe(1);

    // Lomba lain tetap boleh.
    $this->actingAs($this->admin)
        ->post(route('admin.judges.assign', $judge->id), ['competition_id' => $other->id])
        ->assertSessionHas('success');
    expect(JudgeAssignment::query()->count())->toBe(2);
});

it('penugasan boleh dihapus bila belum ada lembar nilai', function () {
    $judge = makeJudge();
    $assignment = JudgeAssignment::factory()->create([
        'judge_id' => $judge->id,
        'competition_id' => $this->competition->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.judges.unassign', $assignment->id))
        ->assertSessionHas('success');

    expect(JudgeAssignment::query()->count())->toBe(0);
});

it('penugasan tidak bisa dihapus bila juri sudah punya lembar nilai', function () {
    $judge = makeJudge();
    $assignment = JudgeAssignment::factory()->create([
        'judge_id' => $judge->id,
        'competition_id' => $this->competition->id,
    ]);

    $registration = makeVerifiedRegistration($this->competition);
    ScoreSheet::factory()->create([
        'registration_id' => $registration->id,
        'judge_id' => $judge->id,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.judges.unassign', $assignment->id))
        ->assertSessionHas('error');

    expect(JudgeAssignment::query()->count())->toBe(1);
});

it('penugasan ditolak untuk akun yang bukan juri', function () {
    $participant = User::factory()->create(['role' => Role::Participant->value]);

    $this->actingAs($this->admin)
        ->post(route('admin.judges.assign', $participant->id), ['competition_id' => $this->competition->id])
        ->assertSessionHas('error');

    expect(JudgeAssignment::query()->count())->toBe(0);
});

// AC-F10-04
it('rubrik belum siap bila total bobot bukan 100', function () {
    $judge = makeJudge();

    $response = $this->actingAs($this->admin)->put(route('admin.rubrics.update', $this->competition->id), [
        'criteria' => [
            ['name' => 'Teknik', 'weight' => 40, 'max_score' => 100],
            ['name' => 'Ekspresi', 'weight' => 40, 'max_score' => 100],
        ],
    ]);

    $response->assertSessionHas('success');

    $status = app(RubricStatus::class);
    expect($status->totalWeight($this->competition))->toBe(80);
    expect($status->isReady($this->competition))->toBeFalse();

    $summary = $status->summary($this->competition->fresh());
    expect($summary['message'])->toContain('kurang 20');
    expect($judge->exists)->toBeTrue();
});

it('rubrik siap bila total bobot tepat 100', function () {
    $this->actingAs($this->admin)->put(route('admin.rubrics.update', $this->competition->id), [
        'criteria' => [
            ['name' => 'Teknik', 'weight' => 60, 'max_score' => 100],
            ['name' => 'Ekspresi', 'weight' => 40, 'max_score' => 100],
        ],
    ])->assertSessionHas('success');

    $status = app(RubricStatus::class);

    expect($status->isReady($this->competition->fresh()))->toBeTrue();
    expect($status->summary($this->competition->fresh())['message'])->toBeNull();
    expect(RubricCriterion::query()->orderBy('sort')->pluck('weight')->all())->toBe([60, 40]);
});

it('bobot kriteria harus bilangan bulat minimal 1', function () {
    $this->actingAs($this->admin)->put(route('admin.rubrics.update', $this->competition->id), [
        'criteria' => [['name' => 'Teknik', 'weight' => 0, 'max_score' => 100]],
    ])->assertSessionHasErrors('criteria.0.weight');

    expect(RubricCriterion::query()->count())->toBe(0);
});

// AC-F10-05
it('rubrik terkunci setelah ada lembar nilai', function () {
    $judge = makeJudge();
    $this->actingAs($this->admin)->put(route('admin.rubrics.update', $this->competition->id), [
        'criteria' => [['name' => 'Teknik', 'weight' => 100, 'max_score' => 100]],
    ]);

    $registration = makeVerifiedRegistration($this->competition);
    ScoreSheet::factory()->create([
        'registration_id' => $registration->id,
        'judge_id' => $judge->id,
        'status' => ScoreSheetStatus::Draft->value,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.rubrics.update', $this->competition->id), [
            'criteria' => [['name' => 'Diubah', 'weight' => 100, 'max_score' => 100]],
        ])
        ->assertSessionHas('error');

    expect(RubricCriterion::query()->pluck('name')->all())->toBe(['Teknik']);
});

// AC-F10-06
it('dasbor juri hanya memuat lomba yang ditugaskan', function () {
    $judge = makeJudge();
    $assigned = $this->competition;
    $other = Competition::factory()->published()->create(['name' => 'Lomba Lain']);

    JudgeAssignment::factory()->create(['judge_id' => $judge->id, 'competition_id' => $assigned->id]);

    $mine = makeVerifiedRegistration($assigned);
    makeVerifiedRegistration($assigned);
    makeVerifiedRegistration($other);

    ScoreSheet::factory()->create([
        'registration_id' => $mine->id,
        'judge_id' => $judge->id,
        'status' => ScoreSheetStatus::Locked->value,
        'locked_at' => now(),
    ]);

    $response = $this->actingAs($judge)->get(route('judge.dashboard'));

    $response->assertOk();
    $assignments = $response->viewData('page')['props']['assignments'];

    expect($assignments)->toHaveCount(1);
    expect($assignments[0]['competition']['id'])->toBe($assigned->id);
    expect($assignments[0]['entries_total'])->toBe(2);
    expect($assignments[0]['entries_locked'])->toBe(1);
    expect($assignments[0]['entries_remaining'])->toBe(1);
    expect($assignments[0]['progress_percent'])->toBe(50);
});

// AC-F10-07
it('juri tidak bisa membuka rute admin', function () {
    $judge = makeJudge();

    $this->actingAs($judge)->get(route('admin.dashboard'))->assertForbidden();
    $this->actingAs($judge)->get(route('admin.judges.index'))->assertForbidden();
    $this->actingAs($judge)->get(route('admin.rubrics.edit', $this->competition->id))->assertForbidden();
});

it('juri bisa membuka dasbornya sendiri', function () {
    $judge = makeJudge();

    $this->actingAs($judge)->get(route('judge.dashboard'))->assertOk();
});

it('admin melihat daftar juri beserta penugasannya', function () {
    $judge = makeJudge();
    JudgeAssignment::factory()->create([
        'judge_id' => $judge->id,
        'competition_id' => $this->competition->id,
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.judges.index'));

    $response->assertOk();
    $judges = $response->viewData('page')['props']['judges']['data'];

    expect($judges)->toHaveCount(1);
    expect($judges[0]['name'])->toBe($judge->name);
    expect($judges[0]['assignments'][0]['competition']['id'])->toBe($this->competition->id);
});

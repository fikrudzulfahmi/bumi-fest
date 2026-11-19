<?php

use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\ScoreSheetStatus;
use App\Models\Competition;
use App\Models\Invoice;
use App\Models\Registration;
use App\Models\RubricCriterion;
use App\Models\ScoreSheet;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => Role::Admin->value]);
    $this->competition = Competition::factory()->published()->create();
});

function f13VerifiedEntry(Competition $competition): Registration
{
    return Registration::factory()->create([
        'competition_id' => $competition->id,
        'status' => RegistrationStatus::Verified->value,
    ]);
}

// AC-F13-01
it('AC-F13-01 perubahan status tagihan, nilai, juara, pengaturan tercatat dengan pelaku', function () {
    // 1) Tagihan diterima → tercatat
    $invoice = Invoice::factory()->create(['status' => 'awaiting_verification']);
    $invoice->registrations()->create([
        'competition_id' => $this->competition->id,
        'owner_id' => $this->admin->id,
        'code' => 'BF26-SD-99999',
        'status' => RegistrationStatus::AwaitingVerification->value,
        'fee' => 50000,
    ]);

    $this->actingAs($this->admin)->post(route('admin.payments.verify', $invoice->id));

    expect(Activity::where('description', 'Tagihan diterima')->where('causer_id', $this->admin->id)->exists())->toBeTrue();

    // 2) Nilai terkunci → tercatat
    $competition = $this->competition;
    $judge = User::factory()->create(['role' => Role::Judge->value, 'email_verified_at' => now()]);
    $competition->judgeAssignments()->create(['judge_id' => $judge->id]);

    $criterion = RubricCriterion::factory()->create([
        'competition_id' => $competition->id,
        'weight' => 100,
        'max_score' => 100,
        'sort' => 1,
    ]);

    $entry = f13VerifiedEntry($competition);
    $sheet = ScoreSheet::factory()->create([
        'registration_id' => $entry->id,
        'judge_id' => $judge->id,
        'status' => ScoreSheetStatus::Draft->value,
    ]);
    $sheet->scores()->create(['criterion_id' => $criterion->id, 'value' => 90]);

    $this->actingAs($judge)->post(route('judge.scores.lock', $entry->id));

    expect(Activity::where('description', 'Lembar nilai dikunci')->exists())->toBeTrue();

    // 3) Juara ditetapkan → tercatat
    $this->actingAs($this->admin)->post(route('admin.results.placements', $competition->id), [
        'placements' => [$entry->id => 1],
    ]);

    expect(Activity::where('description', 'Juara lomba ditetapkan')->exists())->toBeTrue();

    // 4) Pengaturan diperbarui → tercatat
    $this->actingAs($this->admin)->put(route('admin.settings.update'), [
        'event_name' => 'Bumi Fest 2026',
        'contact_whatsapp' => '6281234567890',
        'contact_email' => 'panitia@bumifest.local',
        'payment_due_hours' => 48,
        'max_competitions_per_participant' => null,
        'import_max_rows' => 300,
    ]);

    expect(Activity::where('description', 'Pengaturan diperbarui')->exists())->toBeTrue();
});

// AC-F13-03
it('AC-F13-03 halaman galat 403/404/419/500 berbahasa Indonesia', function () {
    // 403 — akses rute admin tanpa peran
    $participant = User::factory()->create(['role' => Role::Participant->value, 'email_verified_at' => now()]);

    $response = $this->actingAs($participant)->get('/admin');
    expect($response->status())->toBe(403);
    expect($response->getContent())->toContain('Akses Ditolak');

    // 404 — halaman tak dikenal
    $response = $this->get('/halaman-tidak-ada');
    expect($response->status())->toBe(404);
    expect($response->getContent())->toContain('Halaman Tidak Ditemukan');

    // 419 — sesi kedaluwarsa: render view galat langsung
    $html = view('errors::419')->render();
    expect($html)->toContain('Sesi Kedaluwarsa');

    // 500 — render view galat langsung
    $html = view('errors::500')->render();
    expect($html)->toContain('Terjadi Kesalahan');
});

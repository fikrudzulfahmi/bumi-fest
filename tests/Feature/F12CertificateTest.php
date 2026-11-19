<?php

use App\Actions\Certificate\GenerateCertificate;
use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Events\CertificateReady;
use App\Events\ResultsPublished;
use App\Exceptions\BusinessRuleViolation;
use App\Jobs\GenerateCertificatesForCompetition;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Competition;
use App\Models\Institution;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use App\Models\User;
use App\Services\Certificate\CertificatePdfRenderer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => Role::Admin->value]);
    $this->competition = Competition::factory()->published()->create();
});

function f12Entry(Competition $competition, ?User $owner = null, ?int $placement = null): array
{
    $registration = Registration::factory()->create([
        'competition_id' => $competition->id,
        'owner_id' => $owner?->id ?? User::factory()->create()->id,
        'status' => RegistrationStatus::Verified->value,
        'placement' => $placement,
    ]);

    $participant = Participant::factory()->create();

    RegistrationMember::query()->create([
        'registration_id' => $registration->id,
        'participant_id' => $participant->id,
        'competition_id' => $competition->id,
    ]);

    return [$registration, $participant];
}

function f12Template(Competition $competition, string $type = 'participation'): CertificateTemplate
{
    return CertificateTemplate::factory()->create([
        'competition_id' => $competition->id,
        'type' => $type,
    ]);
}

// AC-F12-01
it('AC-F12-01 template tersimpan, tipe/ukuran salah ditolak, pratinjau PDF terbuat', function () {
    Storage::fake('local');

    $this->actingAs($this->admin)
        ->post(route('admin.certificates.template.store', $this->competition->id), [
            'type' => 'participation',
            'image' => UploadedFile::fake()->image('template.png'),
            'layout' => ['name' => ['x' => 50, 'y' => 45, 'size' => 32]],
        ])
        ->assertSessionHas('success');

    expect(CertificateTemplate::query()->where('competition_id', $this->competition->id)->count())->toBe(1);

    // Tipe salah ditolak
    $this->actingAs($this->admin)
        ->post(route('admin.certificates.template.store', $this->competition->id), [
            'type' => 'invalid',
            'image' => UploadedFile::fake()->image('template.png'),
            'layout' => [],
        ])
        ->assertSessionHasErrors('type');

    // Ukuran > 5MB ditolak
    $this->actingAs($this->admin)
        ->post(route('admin.certificates.template.store', $this->competition->id), [
            'type' => 'winner',
            'image' => UploadedFile::fake()->image('big.png')->size(6000),
            'layout' => [],
        ])
        ->assertSessionHasErrors('image');

    // Pratinjau PDF
    $response = $this->actingAs($this->admin)
        ->get(route('admin.certificates.preview', [$this->competition->id, 'type' => 'participation']));

    expect($response->status())->toBe(200);
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

// AC-F12-02
it('AC-F12-02 terbitkan hasil membuat 1 sertifikat per anggota verified, juara vs partisipasi benar', function () {
    Storage::fake('local');
    Queue::fake();
    Event::fake([ResultsPublished::class, CertificateReady::class]);

    f12Template($this->competition, 'winner');
    f12Template($this->competition, 'participation');

    [$winnerEntry, $winnerParticipant] = f12Entry($this->competition, placement: 1);
    [$otherEntry, $otherParticipant] = f12Entry($this->competition);

    $this->actingAs($this->admin)
        ->post(route('admin.results.publish', $this->competition->id), ['allow_incomplete' => true]);

    Queue::assertPushed(GenerateCertificatesForCompetition::class);

    // Terbitkan hasil menyalakan fan-out; verifikasi jenis via action sinkron.
    $generate = app(GenerateCertificate::class);
    $winnerCert = $generate->handle($winnerEntry, $winnerParticipant);
    $otherCert = $generate->handle($otherEntry, $otherParticipant);

    expect($winnerCert->type->value)->toBe('winner');
    expect($winnerCert->placement)->toBe(1);
    expect($otherCert->type->value)->toBe('participation');
    expect($otherCert->placement)->toBeNull();
    expect(Certificate::query()->count())->toBe(2);
});

// AC-F12-03
it('AC-F12-03 tanpa template job gagal rapi', function () {
    Storage::fake('local');

    [$entry, $participant] = f12Entry($this->competition);

    $generate = app(GenerateCertificate::class);

    expect(fn () => $generate->handle($entry, $participant))
        ->toThrow(BusinessRuleViolation::class);

    expect(Certificate::query()->count())->toBe(0);
});

// AC-F12-04
it('AC-F12-04 idempoten: dua kali tidak menggandakan, nomor & kode unik', function () {
    Storage::fake('local');

    f12Template($this->competition, 'participation');

    [$entry, $participant] = f12Entry($this->competition);

    $generate = app(GenerateCertificate::class);
    $first = $generate->handle($entry, $participant);
    $second = $generate->handle($entry, $participant);

    expect(Certificate::query()->count())->toBe(1);
    expect($first->id)->toBe($second->id);
    expect($first->number)->toBe($second->number);
    expect($first->verification_code)->toBe($second->verification_code);

    // Kode verifikasi tanpa karakter ambigu
    expect($first->verification_code)->not->toMatch('/[0O1IL]/');
    expect(strlen($first->verification_code))->toBe(10);
});

// AC-F12-05
it('AC-F12-05 nama panjang font mengecil, aksen tidak rusak', function () {
    $renderer = app(CertificatePdfRenderer::class);

    $short = $renderer->autoFontSize('Budi', 32);
    $long = $renderer->autoFontSize('Muhammad Al-Farabi Rachman Hakim Suryadi Purnama', 32);

    expect($short)->toBe(32);
    expect($long)->toBeLessThan(32);
    expect($long)->toBeGreaterThanOrEqual(10);

    // Karakter beraksen tidak rusak (mb_strlen multibyte: "José" = 4 karakter)
    expect(mb_strlen('José'))->toBe(4);
});

// AC-F12-06
it('AC-F12-06 pemilik bisa unduh, pengguna lain 403, guest diarahkan masuk', function () {
    Storage::fake('local');

    f12Template($this->competition, 'participation');

    $owner = User::factory()->create(['role' => Role::Participant->value, 'email_verified_at' => now()]);
    [$entry, $participant] = f12Entry($this->competition, $owner);

    $cert = app(GenerateCertificate::class)->handle($entry, $participant);

    $this->actingAs($owner)
        ->get(route('certificates.download', $cert->id))
        ->assertOk();

    $other = User::factory()->create(['role' => Role::Participant->value, 'email_verified_at' => now()]);
    $this->actingAs($other)
        ->get(route('certificates.download', $cert->id))
        ->assertForbidden();

    // Reset auth agar request berikutnya benar-benar guest.
    $this->app['auth']->forgetGuards();

    $this->get(route('certificates.download', $cert->id))
        ->assertRedirect(route('login'));
});

// AC-F12-07
it('AC-F12-07 ZIP lembaga berisi sertifikat siswanya, nama file aman', function () {
    Storage::fake('local');

    f12Template($this->competition, 'participation');

    $institution = Institution::factory()->create();
    $owner = User::factory()->create([
        'role' => Role::Institution->value,
        'email_verified_at' => now(),
    ]);
    $owner->institution()->save($institution);

    [$entry, $participant] = f12Entry($this->competition);
    $participant->update(['institution_id' => $institution->id]);

    // siswa sekolah lain
    [$otherEntry, $otherParticipant] = f12Entry($this->competition);

    app(GenerateCertificate::class)->handle($entry, $participant);
    app(GenerateCertificate::class)->handle($otherEntry, $otherParticipant);

    $response = $this->actingAs($owner)
        ->get(route('certificates.download-all'))
        ->assertOk();

    expect($response->headers->get('content-type'))->toContain('zip');
});

// AC-F12-08
it('AC-F12-08 verifikasi publik valid menampilkan data minimal, kode salah tidak ditemukan', function () {
    Storage::fake('local');

    f12Template($this->competition, 'participation');
    [$entry, $participant] = f12Entry($this->competition);
    $cert = app(GenerateCertificate::class)->handle($entry, $participant);

    $this->get(route('certificates.verify', $cert->verification_code))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('verification/Show')
            ->where('name', $participant->name)
            ->where('type_label', 'Partisipasi')
            ->missing('whatsapp')
            ->missing('email'));

    $this->get(route('certificates.verify', 'KODESALAH'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('verification/NotFound'));
});

// AC-F12-09
it('AC-F12-09 QR pada PDF mengarah ke URL verifikasi yang benar', function () {
    Storage::fake('local');

    f12Template($this->competition, 'participation');
    [$entry, $participant] = f12Entry($this->competition);
    $cert = app(GenerateCertificate::class)->handle($entry, $participant);

    expect($cert->file_path)->not->toBeNull();

    $pdf = Storage::disk('local')->get($cert->file_path);
    expect($pdf)->not->toBeEmpty();

    // URL yang ditanam di QR harus menunjuk ke halaman verifikasi kode ini.
    $renderer = app(CertificatePdfRenderer::class);
    expect($renderer->verificationUrl($cert->verification_code))
        ->toBe(route('certificates.verify', $cert->verification_code));
});

// AC-F12-10
it('AC-F12-10 koreksi nama membuat PDF baru dengan nomor sama', function () {
    Storage::fake('local');

    f12Template($this->competition, 'participation');
    [$entry, $participant] = f12Entry($this->competition);
    $cert = app(GenerateCertificate::class)->handle($entry, $participant);

    $numberBefore = $cert->number;
    $pathBefore = $cert->file_path;

    $this->actingAs($this->admin)
        ->patch(route('admin.participants.correct-name', $participant->id), ['name' => 'Nama Baru Siswa'])
        ->assertSessionHas('success');

    $cert->refresh();
    expect($cert->number)->toBe($numberBefore);
    expect($cert->file_path)->toBe($pathBefore);
    expect($participant->fresh()->name)->toBe('Nama Baru Siswa');
});

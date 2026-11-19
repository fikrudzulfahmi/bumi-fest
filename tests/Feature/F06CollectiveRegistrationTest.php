<?php

namespace Tests\Feature;

use App\Actions\Import\CommitCollectiveImport;
use App\Actions\Import\PreviewCollectiveImport;
use App\Enums\CompetitionCategory;
use App\Enums\Level;
use App\Enums\Role;
use App\Exceptions\BusinessRuleViolation;
use App\Models\BankAccount;
use App\Models\Competition;
use App\Models\Institution;
use App\Models\Invoice;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\User;
use App\Services\Settings\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class F06CollectiveRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    protected function institutionUser(): User
    {
        $user = User::factory()->create([
            'role' => Role::Institution->value,
            'preferred_level' => Level::SdMi->value,
        ]);

        Institution::create([
            'user_id' => $user->id,
            'name' => 'SD Negeri 1',
            'npsn' => (string) fake()->unique()->numerify('########'),
            'city' => 'Malang',
        ]);

        return $user->fresh();
    }

    protected function participantUser(): User
    {
        return User::factory()->create([
            'role' => Role::Participant->value,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function competition(array $overrides = []): Competition
    {
        return Competition::factory()->create(array_merge([
            'level' => Level::SdMi->value,
            'status' => 'published',
            'opens_at' => now()->subDay(),
            'closes_at' => now()->addDays(5),
            'category' => CompetitionCategory::Individual->value,
            'fee' => 50000,
            'quota' => 50,
            'submission_mode' => 'none',
        ], $overrides));
    }

    protected function csv(array $lines): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            'siswa.csv',
            implode("\n", $lines)."\n"
        );
    }

    // AC-F06-01: peserta biasa 403 di rute kolektif
    public function test_ac_f06_01_participant_forbidden(): void
    {
        $competition = $this->competition();
        $user = $this->participantUser();

        $this->actingAs($user)
            ->get("/portal/sd_mi/lomba/{$competition->slug}/daftar-kolektif")
            ->assertForbidden();
    }

    // AC-F06-02: template berisi kolom benar
    public function test_ac_f06_02_template_columns(): void
    {
        $competition = $this->competition();
        $user = $this->institutionUser();

        $response = $this->actingAs($user)
            ->get("/portal/sd_mi/lomba/{$competition->slug}/template");

        $response->assertOk();
        $this->assertStringContainsString('nama_siswa', $response->streamedContent());
        $this->assertStringContainsString('kelas', $response->streamedContent());
    }

    public function test_ac_f06_02_template_includes_team_column_for_team_competition(): void
    {
        $competition = $this->competition([
            'category' => CompetitionCategory::Team->value,
            'team_min' => 2,
            'team_max' => 3,
        ]);
        $user = $this->institutionUser();

        $content = $this->actingAs($user)
            ->get("/portal/sd_mi/lomba/{$competition->slug}/template")
            ->streamedContent();

        $this->assertStringContainsString('tim', $content);
    }

    // AC-F06-03: pratinjau menandai baris bermasalah, tanpa menyimpan
    public function test_ac_f06_03_preview_flags_rows_without_saving(): void
    {
        $competition = $this->competition();
        $user = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas',
            'Budi,3',
            'Budi,3',      // ganda dalam berkas
            ',4',          // nama kosong
            'Sari,9',      // kelas di luar jenjang SD
        ]);

        $result = app(PreviewCollectiveImport::class)->handle($user, $competition, $file);

        $this->assertGreaterThanOrEqual(3, count($result['errors']));
        $this->assertSame(0, Participant::count());
        $this->assertSame(0, Registration::count());
        $this->assertNotNull($result['token']);
    }

    public function test_ac_f06_03_preview_flags_team_size_out_of_range(): void
    {
        $competition = $this->competition([
            'category' => CompetitionCategory::Team->value,
            'team_min' => 3,
            'team_max' => 3,
        ]);
        $user = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas,tim',
            'Budi,3,Merah',
            'Sari,3,Merah',
        ]);

        $result = app(PreviewCollectiveImport::class)->handle($user, $competition, $file);

        $messages = implode(' ', array_column($result['errors'], 'message'));
        $this->assertStringContainsString('Merah', $messages);
        $this->assertSame(0, Registration::count());
    }

    // AC-F06-04: berkas kebanyakan baris / format salah ditolak
    public function test_ac_f06_04_rejects_too_many_rows(): void
    {
        Cache::flush();
        Settings::set('import_max_rows', 2);

        $competition = $this->competition();
        $user = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas',
            'A,3',
            'B,4',
            'C,5',
        ]);

        $this->expectException(BusinessRuleViolation::class);

        app(PreviewCollectiveImport::class)->handle($user, $competition, $file);
    }

    public function test_ac_f06_04_rejects_unsupported_format(): void
    {
        $competition = $this->competition();
        $user = $this->institutionUser();

        $file = UploadedFile::fake()->createWithContent('siswa.txt', 'nama_siswa,kelas');

        $this->expectException(BusinessRuleViolation::class);

        app(PreviewCollectiveImport::class)->handle($user, $competition, $file);
    }

    // AC-F06-05: commit membuat siswa + entri, satu tagihan
    public function test_ac_f06_05_commit_creates_entries_and_single_invoice(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition();
        $user = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas',
            'Budi,3',
            'Sari,4',
        ]);

        $preview = app(PreviewCollectiveImport::class)->handle($user, $competition, $file);

        $this->assertCount(0, $preview['errors']);

        $result = app(CommitCollectiveImport::class)->handle($user, $competition, $preview['token']);

        $this->assertCount(2, $result['registrations']);
        $this->assertSame(2, Participant::count());
        $this->assertSame(2, Registration::where('competition_id', $competition->id)->count());

        $invoice = $result['invoice'];
        $this->assertSame(2 * 50000, $invoice->subtotal);
        $this->assertSame($invoice->subtotal + $invoice->unique_code, $invoice->total);
        $this->assertSame(1, Invoice::count());
        $this->assertSame(2, Registration::where('invoice_id', $invoice->id)->count());
    }

    public function test_ac_f06_05_team_rows_group_into_one_entry(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition([
            'category' => CompetitionCategory::Team->value,
            'team_min' => 2,
            'team_max' => 2,
            'fee' => 75000,
        ]);
        $user = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas,tim',
            'Budi,3,Merah',
            'Sari,3,Merah',
        ]);

        $preview = app(PreviewCollectiveImport::class)->handle($user, $competition, $file);
        $this->assertSame(1, $preview['entries']);

        $result = app(CommitCollectiveImport::class)->handle($user, $competition, $preview['token']);

        $this->assertCount(1, $result['registrations']);
        $this->assertSame('Merah', $result['registrations'][0]->team_name);
        $this->assertSame(2, $result['registrations'][0]->members()->count());
        $this->assertSame(75000, $result['invoice']->subtotal);
    }

    // AC-F06-06: kuota kurang → atomik ditolak
    public function test_ac_f06_06_rejects_whole_commit_when_quota_insufficient(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition(['quota' => 1]);
        $user = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas',
            'Budi,3',
            'Sari,4',
        ]);

        $preview = app(PreviewCollectiveImport::class)->handle($user, $competition, $file);

        try {
            app(CommitCollectiveImport::class)->handle($user, $competition, $preview['token']);
            $this->fail('Commit seharusnya ditolak karena kuota kurang.');
        } catch (BusinessRuleViolation) {
            $this->assertSame(0, Registration::count());
            $this->assertSame(0, Invoice::count());
        }
    }

    // AC-F06-07: token kedaluwarsa / milik pengguna lain
    public function test_ac_f06_07_rejects_unknown_token(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition();
        $user = $this->institutionUser();

        $this->expectException(BusinessRuleViolation::class);

        app(CommitCollectiveImport::class)->handle($user, $competition, 'token-palsu');
    }

    public function test_ac_f06_07_rejects_token_of_other_user(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition();
        $owner = $this->institutionUser();
        $other = $this->institutionUser();

        $file = $this->csv([
            'nama_siswa,kelas',
            'Budi,3',
        ]);

        $preview = app(PreviewCollectiveImport::class)->handle($owner, $competition, $file);

        $this->expectException(BusinessRuleViolation::class);

        app(CommitCollectiveImport::class)->handle($other, $competition, $preview['token']);
    }

    // AC-F06-08: siswa yang sudah ada dipakai ulang
    public function test_ac_f06_08_reuses_existing_participant(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition();
        $user = $this->institutionUser();

        $existing = Participant::factory()->create([
            'owner_id' => $user->id,
            'name' => 'Budi',
            'grade' => 3,
            'level' => Participant::levelForGrade(3)->value,
        ]);

        $file = $this->csv([
            'nama_siswa,kelas',
            'Budi,3',
        ]);

        $preview = app(PreviewCollectiveImport::class)->handle($user, $competition, $file);
        $this->assertCount(0, $preview['errors']);

        $result = app(CommitCollectiveImport::class)->handle($user, $competition, $preview['token']);

        $this->assertSame(1, Participant::count());
        $this->assertSame(
            $existing->id,
            $result['registrations'][0]->members()->first()->participant_id
        );
    }

    // AC-F06-09: menambah siswa setelah tagihan ada → tagihan baru
    public function test_ac_f06_09_second_commit_creates_new_invoice(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition();
        $user = $this->institutionUser();

        $first = app(PreviewCollectiveImport::class)->handle(
            $user,
            $competition,
            $this->csv(['nama_siswa,kelas', 'Budi,3'])
        );
        $firstInvoice = app(CommitCollectiveImport::class)
            ->handle($user, $competition, $first['token'])['invoice'];

        $second = app(PreviewCollectiveImport::class)->handle(
            $user,
            $competition,
            $this->csv(['nama_siswa,kelas', 'Sari,4'])
        );
        $secondInvoice = app(CommitCollectiveImport::class)
            ->handle($user, $competition, $second['token'])['invoice'];

        $this->assertNotSame($firstInvoice->id, $secondInvoice->id);
        $this->assertSame(50000, $firstInvoice->fresh()->subtotal);
        $this->assertSame(50000, $secondInvoice->subtotal);
        $this->assertSame(2, Invoice::count());
    }

    // AC-F06-10: dasbor sekolah hanya menampilkan entri miliknya
    public function test_ac_f06_10_school_dashboard_is_scoped(): void
    {
        BankAccount::factory()->create(['is_active' => true]);

        $competition = $this->competition();
        $mine = $this->institutionUser();
        $other = $this->institutionUser();

        foreach ([[$mine, 'Budi'], [$other, 'Sari']] as [$owner, $name]) {
            $preview = app(PreviewCollectiveImport::class)->handle(
                $owner,
                $competition,
                $this->csv(['nama_siswa,kelas', "{$name},3"])
            );
            app(CommitCollectiveImport::class)->handle($owner, $competition, $preview['token']);
        }

        $response = $this->actingAs($mine)->get('/daftar-kolektif');

        $response->assertOk();
        $registrations = $response->viewData('page')['props']['registrations'];

        $this->assertCount(1, $registrations);
        $this->assertSame(['Budi'], $registrations[0]['member_names']);
    }

    // Pratinjau lewat HTTP: tampil di sesi, belum menyimpan
    public function test_preview_endpoint_stores_preview_in_session(): void
    {
        $competition = $this->competition();
        $user = $this->institutionUser();

        $response = $this->actingAs($user)->post(
            "/portal/sd_mi/lomba/{$competition->slug}/pratinjau",
            ['file' => $this->csv(['nama_siswa,kelas', 'Budi,3'])]
        );

        $response->assertRedirect();
        $response->assertSessionHas('collective_preview');
        $this->assertSame(0, Registration::count());
    }
}

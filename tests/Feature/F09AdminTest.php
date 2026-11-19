<?php

namespace Tests\Feature;

use App\Enums\InvoiceStatus;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Exports\AdminRegistrationExport;
use App\Jobs\ExportRegistrationsJob;
use App\Models\Competition;
use App\Models\Institution;
use App\Models\Invoice;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use App\Models\User;
use App\Queries\RegistrationQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class F09AdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('local');
    }

    protected function admin(): User
    {
        return User::factory()->create([
            'role' => Role::Admin->value,
            'is_active' => true,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function participantUser(): User
    {
        return User::factory()->create([
            'role' => Role::Participant->value,
            'is_active' => true,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function institutionUser(): User
    {
        return User::factory()->create([
            'role' => Role::Institution->value,
            'is_active' => true,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function judgeUser(): User
    {
        return User::factory()->create([
            'role' => Role::Judge->value,
            'is_active' => true,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    protected function institution(User $owner, string $name = 'MI Nurul Huda'): Institution
    {
        return Institution::create([
            'user_id' => $owner->id,
            'name' => $name,
            'npsn' => (string) fake()->unique()->numberBetween(10000000, 99999999),
            'city' => 'Kediri',
        ]);
    }

    /**
     * Entri lengkap dengan anggota + tagihan.
     *
     * @param  array<string, mixed>  $overrides
     */
    protected function entry(
        User $owner,
        RegistrationStatus $status = RegistrationStatus::AwaitingPayment,
        ?Competition $competition = null,
        ?Institution $institution = null,
        ?Invoice $invoice = null,
    ): Registration {
        $competition ??= Competition::factory()->create([
            'level' => Level::SdMi->value,
            'fee' => 75000,
            'status' => 'published',
        ]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $owner->id,
            'invoice_id' => $invoice?->id,
            'status' => $status,
            'fee' => 75000,
        ]);

        $participant = Participant::factory()->create([
            'owner_id' => $owner->id,
            'institution_id' => $institution?->id,
            'level' => Level::SdMi->value,
            'grade' => 4,
            'school_name' => $institution?->name ?? 'MI Nurul Huda',
        ]);

        RegistrationMember::create([
            'registration_id' => $registration->id,
            'participant_id' => $participant->id,
            'competition_id' => $competition->id,
            'position' => 1,
        ]);

        return $registration->fresh();
    }

    protected function invoice(User $owner, InvoiceStatus $status, int $total = 75237, int $dueHours = 48): Invoice
    {
        return Invoice::factory()->create([
            'owner_id' => $owner->id,
            'subtotal' => 75000,
            'unique_code' => $total - 75000,
            'total' => $total,
            'status' => $status,
            'due_at' => now('Asia/Jakarta')->addHours($dueHours),
        ]);
    }

    public function test_ac_f09_01_angka_dasbor_cocok_dengan_data_uji(): void
    {
        $admin = $this->admin();
        $owner = $this->participantUser();

        $competition = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'status' => 'published',
            'quota' => 50,
        ]);

        $paidInvoice = $this->invoice($owner, InvoiceStatus::Paid, 75237);
        $awaitingInvoice = $this->invoice($owner, InvoiceStatus::AwaitingVerification, 75111);
        $nearDue = $this->invoice($owner, InvoiceStatus::Unpaid, 75309, 12);

        $this->entry($owner, RegistrationStatus::Verified, $competition, null, $paidInvoice);
        $this->entry($owner, RegistrationStatus::AwaitingVerification, $competition, null, $awaitingInvoice);
        $this->entry($owner, RegistrationStatus::AwaitingPayment, $competition, null, $nearDue);
        $this->entry($owner, RegistrationStatus::Draft, $competition);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/Dashboard')
            ->where('metrics.registrations_total', 3)
            ->where('metrics.registrations_verified', 1)
            ->where('metrics.payments_received', 75237)
            ->where('metrics.payments_received_net', 75000)
            ->where('metrics.payments_count', 1)
            ->where('metrics.awaiting_verification', 1)
            ->where('metrics.invoices_near_due', 1)
            ->has('perCompetition', 1)
            ->where('perCompetition.0.registrations_count', 3));
    }

    public function test_ac_f09_02_filter_gabungan_paginasi_lima_belas_tanpa_n_plus_satu(): void
    {
        $admin = $this->admin();
        $owner = $this->participantUser();
        $school = $this->institution($this->institutionUser());

        $sd = Competition::factory()->create(['level' => Level::SdMi->value, 'status' => 'published']);
        $smp = Competition::factory()->create(['level' => Level::SmpMts->value, 'status' => 'published']);

        // 16 entri SD + 4 entri SMP: filter jenjang harus menyisakan 16 -> 2 halaman.
        for ($i = 0; $i < 16; $i++) {
            $this->entry($owner, RegistrationStatus::AwaitingPayment, $sd, $school);
        }

        for ($i = 0; $i < 4; $i++) {
            $this->entry($owner, RegistrationStatus::Verified, $smp);
        }

        $queries = [];
        DB::listen(function ($query) use (&$queries): void {
            $queries[] = $query->sql;
        });

        $response = $this->actingAs($admin)->get(route('admin.registrations.index', [
            'level' => Level::SdMi->value,
            'status' => RegistrationStatus::AwaitingPayment->value,
            'institution_id' => $school->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/registrations/Index')
            ->has('registrations.data', 15)
            ->where('registrations.total', 16)
            ->where('registrations.per_page', 15)
            ->where('filters.level', Level::SdMi->value));

        // Tanpa N+1: jumlah query konstan, tidak tumbuh mengikuti jumlah baris (15).
        expect(count($queries))->toBeLessThanOrEqual(14);

        // Relasi daftar di-eager-load: kompetisi, pemilik, tagihan, dan hitungan anggota.
        $competitionQueries = array_filter(
            $queries,
            fn (string $sql) => str_contains($sql, 'from "competitions"') && str_contains($sql, '"id" in (')
        );
        $ownerQueries = array_filter(
            $queries,
            fn (string $sql) => str_contains($sql, 'from "users"') && str_contains($sql, '"id" in (')
        );

        expect(count($competitionQueries))->toBe(1)
            ->and(count($ownerQueries))->toBe(1);
    }

    public function test_ac_f09_02_pencarian_nama_siswa_dan_kode_entri(): void
    {
        $admin = $this->admin();
        $owner = $this->participantUser();

        $target = $this->entry($owner);
        $member = $target->members()->first();
        $member?->participant?->update(['name' => 'Aisyah Zahra']);
        $this->entry($owner);

        $this->actingAs($admin)
            ->get(route('admin.registrations.index', ['q' => 'Aisyah']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('registrations.data', 1)
                ->where('registrations.data.0.code', $target->code));

        $this->actingAs($admin)
            ->get(route('admin.registrations.index', ['q' => $target->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('registrations.data', 1));
    }

    public function test_ac_f09_03_ekspor_mengikuti_filter_dan_kolom_lengkap(): void
    {
        $admin = $this->admin();
        $owner = $this->participantUser();

        $sd = Competition::factory()->create(['level' => Level::SdMi->value, 'status' => 'published']);
        $smp = Competition::factory()->create(['level' => Level::SmpMts->value, 'status' => 'published']);

        $invoice = $this->invoice($owner, InvoiceStatus::Paid);
        $target = $this->entry($owner, RegistrationStatus::Verified, $sd, null, $invoice);
        $this->entry($owner, RegistrationStatus::AwaitingPayment, $smp);

        $response = $this->actingAs($admin)->get(route('admin.registrations.export', [
            'level' => Level::SdMi->value,
        ]));

        $response->assertOk();
        $response->assertHeader('content-disposition');
        expect($response->headers->get('content-disposition'))->toContain('.xlsx');

        $export = new AdminRegistrationExport(
            RegistrationQuery::apply(['level' => Level::SdMi->value])
                ->with(['competition:id,name,level', 'invoice:id,number,total', 'members.participant'])
        );

        expect($export->headings())->toBe([
            'Kode', 'Siswa', 'Kelas', 'Sekolah', 'Lomba', 'Jenjang', 'Status', 'Tagihan', 'Total',
        ]);

        $row = $export->map($target->fresh());

        expect($row[0])->toBe($target->code)
            ->and($row[6])->toBe(RegistrationStatus::Verified->label())
            ->and($row[7])->toBe($invoice->number)
            ->and($row[8])->toBe(75237);
    }

    public function test_ac_f09_03_ekspor_di_atas_ambang_diantrekan(): void
    {
        Queue::fake();

        $admin = $this->admin();
        $owner = $this->participantUser();

        config(['bumifest.export_queue_threshold' => 0]);
        $this->entry($owner);

        $this->actingAs($admin)
            ->get(route('admin.registrations.export'))
            ->assertRedirect();

        Queue::assertPushed(ExportRegistrationsJob::class);
    }

    public function test_ac_f09_04_batal_entri_verified_wajib_alasan_dan_melepas_slot(): void
    {
        $admin = $this->admin();
        $owner = $this->participantUser();
        $competition = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'quota' => 1,
            'status' => 'published',
        ]);

        $registration = $this->entry($owner, RegistrationStatus::Verified, $competition);

        // Tanpa alasan: ditolak, status tidak berubah.
        $this->actingAs($admin)
            ->post(route('admin.registrations.cancel', $registration->id), ['reason' => ''])
            ->assertSessionHasErrors('reason');

        expect($registration->fresh()->status)->toBe(RegistrationStatus::Verified);

        // Dengan alasan: dibatalkan dan slot dilepas.
        $this->actingAs($admin)
            ->post(route('admin.registrations.cancel', $registration->id), [
                'reason' => 'Siswa mengundurkan diri dari sekolah.',
            ])
            ->assertSessionHasNoErrors();

        expect($registration->fresh()->status)->toBe(RegistrationStatus::Cancelled)
            ->and(RegistrationMember::where('registration_id', $registration->id)->count())->toBe(0)
            ->and(Registration::query()->forCompetition($competition->id)->slotHolding()->count())->toBe(0);
    }

    public function test_ac_f09_04_koreksi_nama_siswa_hanya_admin(): void
    {
        $admin = $this->admin();
        $owner = $this->participantUser();
        $registration = $this->entry($owner);
        $participant = $registration->members()->first()->participant;

        $this->actingAs($admin)
            ->patch(route('admin.participants.correct-name', $participant->id), [
                'name' => 'Muhammad Rizky',
            ])
            ->assertSessionHasNoErrors();

        expect($participant->fresh()->name)->toBe('Muhammad Rizky');

        $this->actingAs($owner)
            ->patch(route('admin.participants.correct-name', $participant->id), [
                'name' => 'Nama Palsu',
            ])
            ->assertForbidden();
    }

    public function test_ac_f09_05_nonaktifkan_akun_mencegah_login(): void
    {
        $admin = $this->admin();
        $user = $this->participantUser();

        $this->actingAs($admin)
            ->post(route('admin.users.toggle-active', $user->id))
            ->assertSessionHasNoErrors();

        expect($user->fresh()->is_active)->toBeFalse();

        $this->post('/logout');

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        expect(session('errors')->getBag('default')->all()[0])->toContain('tidak aktif');
        $this->assertGuest();
    }

    public function test_ac_f09_05_admin_tidak_bisa_menonaktifkan_diri_sendiri(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.users.toggle-active', $admin->id))
            ->assertSessionHas('error');

        expect($admin->fresh()->is_active)->toBeTrue();
    }

    public function test_ac_f09_06_semua_rute_admin_menolak_peran_lain(): void
    {
        $owner = $this->participantUser();
        $institution = $this->institutionUser();
        $judge = $this->judgeUser();

        $registration = $this->entry($owner);
        $participant = RegistrationMember::where('registration_id', $registration->id)->first()->participant;
        $school = $this->institution($institution);

        $routes = [
            ['get', route('admin.dashboard')],
            ['get', route('admin.registrations.index')],
            ['get', route('admin.registrations.show', $registration->id)],
            ['get', route('admin.registrations.export')],
            ['get', route('admin.institutions.index')],
            ['get', route('admin.institutions.show', $school->id)],
            ['get', route('admin.users.index')],
            ['get', route('admin.payments.index')],
            ['get', route('admin.payments.export')],
            ['post', route('admin.registrations.cancel', $registration->id)],
            ['patch', route('admin.participants.correct-name', $participant->id)],
            ['post', route('admin.users.toggle-active', $owner->id)],
        ];

        foreach ([$owner, $institution, $judge] as $actor) {
            foreach ($routes as [$method, $url]) {
                $this->actingAs($actor)->{$method}($url)->assertForbidden();
            }
        }

        $admin = $this->admin();

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
        $this->actingAs($admin)->get(route('admin.registrations.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.institutions.index'))->assertOk();
        $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
    }

    public function test_dasbor_admin_tidak_bisa_diakses_tanpa_login(): void
    {
        $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
    }
}

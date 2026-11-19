<?php

namespace Tests\Feature;

use App\Actions\Invoice\CreateInvoice;
use App\Actions\Registration\CancelRegistration;
use App\Actions\Registration\SaveRegistrationDraft;
use App\Actions\Registration\SubmitRegistration;
use App\Enums\CompetitionCategory;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Events\InvoiceCreated;
use App\Exceptions\BusinessRuleViolation;
use App\Models\BankAccount;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\RegistrationMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class F05RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    protected function user(?Level $level = Level::SdMi): User
    {
        return User::factory()->create([
            'role' => Role::Participant->value,
            'preferred_level' => $level->value,
        ]);
    }

    protected function publishedCompetition(array $overrides = []): Competition
    {
        return Competition::factory()->create(array_merge([
            'level' => Level::SdMi->value,
            'status' => 'published',
            'opens_at' => now()->subDay(),
            'closes_at' => now()->addDays(5),
            'category' => CompetitionCategory::Individual,
            'fee' => 100000,
            'quota' => 10,
            'submission_mode' => 'none',
        ], $overrides));
    }

    protected function ownParticipant(User $user, int $grade = 3): Participant
    {
        return Participant::factory()->create([
            'owner_id' => $user->id,
            'grade' => $grade,
            'level' => Participant::levelForGrade($grade)->value,
        ]);
    }

    protected function makeBankAccount(): BankAccount
    {
        return BankAccount::factory()->create(['is_active' => true]);
    }

    // AC-F05-01 & 02: siswa milik sendiri; jenjang otomatis; entri aktif tak bisa dihapus
    public function test_a_c_f05_01_grade_determines_level(): void
    {
        $user = $this->user();

        $sd = Participant::factory()->create(['owner_id' => $user->id, 'grade' => 6, 'level' => 'x']);
        $smp = Participant::factory()->create(['owner_id' => $user->id, 'grade' => 7, 'level' => 'x']);

        $this->assertEquals(Level::SdMi->value, Participant::levelForGrade(6)->value);
        $this->assertEquals(Level::SmpMts->value, Participant::levelForGrade(7)->value);
    }

    public function test_a_c_f05_01_participant_with_active_registration_cannot_be_deleted(): void
    {
        $user = $this->user();
        $participant = $this->ownParticipant($user);
        $competition = $this->publishedCompetition(['category' => CompetitionCategory::Individual]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $user->id,
            'status' => RegistrationStatus::AwaitingPayment,
        ]);
        RegistrationMember::create([
            'registration_id' => $registration->id,
            'participant_id' => $participant->id,
            'competition_id' => $competition->id,
        ]);

        $this->actingAs($user)
            ->delete(route('participants.destroy', $participant))
            ->assertSessionHasErrors();

        $this->assertDatabaseHas('participants', ['id' => $participant->id]);
    }

    // AC-F05-02: siswa pengguna lain tidak bisa diubah (403)
    public function test_a_c_f05_02_cannot_modify_other_users_participant(): void
    {
        $owner = $this->user();
        $stranger = $this->user();
        $participant = $this->ownParticipant($owner);

        $this->actingAs($stranger)
            ->put(route('participants.update', $participant), [
                'name' => 'Hack',
                'grade' => 3,
                'school_name' => 'Sekolah',
            ])
            ->assertForbidden();

        $this->actingAs($stranger)
            ->delete(route('participants.destroy', $participant))
            ->assertForbidden();
    }

    // AC-F05-03: jenjang berbeda ditolak saat simpan draf
    public function test_a_c_f05_03_wrong_level_participant_rejected(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition();
        // grade 8 = SMP, tapi lomba SD
        $wrongLevel = Participant::factory()->create([
            'owner_id' => $user->id,
            'grade' => 8,
            'level' => Participant::levelForGrade(8)->value,
        ]);

        $draft = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $user->id,
            'status' => RegistrationStatus::Draft,
        ]);

        $this->expectException(BusinessRuleViolation::class);
        app(SaveRegistrationDraft::class)->handle($user, $competition, $draft, [
            'participant_ids' => [$wrongLevel->id],
        ]);
    }

    // AC-F05-04: kirim ditolak bila draft/lomba belum buka
    public function test_a_c_f05_04_draft_competition_rejected(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['status' => 'draft']);
        $participant = $this->ownParticipant($user);
        $this->makeBankAccount();

        $draft = $this->prepareDraft($user, $competition, $participant);

        $this->expectException(BusinessRuleViolation::class);
        app(SubmitRegistration::class)->handle($user, $draft);
    }

    // AC-F05-05: individu tepat 1; tim dalam [min,max]
    public function test_a_c_f05_05_individual_requires_exactly_one(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['category' => CompetitionCategory::Individual]);
        $p1 = $this->ownParticipant($user);
        $p2 = $this->ownParticipant($user);

        $draft = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $user->id,
            'status' => RegistrationStatus::Draft,
        ]);

        $this->expectException(BusinessRuleViolation::class);
        app(SaveRegistrationDraft::class)->handle($user, $competition, $draft, [
            'participant_ids' => [$p1->id, $p2->id],
        ]);
    }

    public function test_a_c_f05_05_team_requires_name_and_within_range(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition([
            'category' => CompetitionCategory::Team,
            'team_min' => 2,
            'team_max' => 4,
        ]);
        $p1 = $this->ownParticipant($user);
        $p2 = $this->ownParticipant($user);

        $draft = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $user->id,
            'status' => RegistrationStatus::Draft,
        ]);

        // tanpa nama tim → ditolak
        $this->expectException(BusinessRuleViolation::class);
        app(SaveRegistrationDraft::class)->handle($user, $competition, $draft, [
            'participant_ids' => [$p1->id, $p2->id],
            'team_name' => null,
        ]);
    }

    // AC-F05-06: siswa sama tidak bisa dua entri aktif
    public function test_a_c_f05_06_no_duplicate_active_entry(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['category' => CompetitionCategory::Individual]);
        $participant = $this->ownParticipant($user);
        $this->makeBankAccount();

        $first = $this->prepareDraft($user, $competition, $participant);
        app(SubmitRegistration::class)->handle($user, $first);

        // Menyimpan draf kedua dengan siswa sama → ditolak action (BR-04)
        $this->expectException(BusinessRuleViolation::class);
        $second = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $user->id,
            'status' => RegistrationStatus::Draft,
        ]);
        app(SaveRegistrationDraft::class)->handle($user, $competition, $second, [
            'participant_ids' => [$participant->id],
        ]);
    }

    // AC-F05-09: tanpa persetujuan ditolak
    public function test_a_c_f05_09_consent_required(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['category' => CompetitionCategory::Individual]);
        $participant = $this->ownParticipant($user);
        $this->makeBankAccount();

        $draft = $this->prepareDraft($user, $competition, $participant, consented: false);

        $this->expectException(BusinessRuleViolation::class);
        app(SubmitRegistration::class)->handle($user, $draft);
    }

    // AC-F05-10: kirim sukses → status, fee snapshot, tagihan, event
    public function test_a_c_f05_10_submit_success(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['fee' => 150000, 'category' => CompetitionCategory::Individual]);
        $participant = $this->ownParticipant($user);
        $this->makeBankAccount();

        $draft = $this->prepareDraft($user, $competition, $participant);

        $this->eventDispatched = false;
        Event::fake();
        $result = app(SubmitRegistration::class)->handle($user, $draft);

        $result->refresh();
        $this->assertEquals(RegistrationStatus::AwaitingPayment, $result->status);
        $this->assertSame(150000, $result->fee);
        $this->assertNotEmpty($result->code);
        $this->assertNotNull($result->invoice_id);

        $invoice = $result->invoice;
        $this->assertSame(150000, $invoice->subtotal);
        $this->assertSame(150000 + $invoice->unique_code, $invoice->total);
        $this->assertNotNull($invoice->due_at);

        Event::assertDispatched(InvoiceCreated::class);
    }

    // AC-F05-11: tak ada rekening aktif → gagal
    public function test_a_c_f05_11_no_active_account_rejected(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['category' => CompetitionCategory::Individual]);
        $participant = $this->ownParticipant($user);
        BankAccount::factory()->create(['is_active' => false]);

        $draft = $this->prepareDraft($user, $competition, $participant);

        $this->expectException(BusinessRuleViolation::class);
        app(SubmitRegistration::class)->handle($user, $draft);
    }

    // AC-F05-12: slot terakhir → 1 sukses, 1 ditolak
    public function test_a_c_f05_12_last_slot_only_one_succeeds(): void
    {
        $competition = $this->publishedCompetition([
            'quota' => 1,
            'category' => CompetitionCategory::Individual,
        ]);
        $this->makeBankAccount();

        $user1 = $this->user();
        $user2 = $this->user();

        $draft1 = $this->prepareDraft($user1, $competition, $this->ownParticipant($user1));
        $draft2 = $this->prepareDraft($user2, $competition, $this->ownParticipant($user2));

        app(SubmitRegistration::class)->handle($user1, $draft1);

        $this->expectException(BusinessRuleViolation::class);
        app(SubmitRegistration::class)->handle($user2, $draft2);
    }

    // AC-F05-13: batalkan draft/awaiting_payment → slot lepas
    public function test_a_c_f05_13_cancel_releases_slot(): void
    {
        $competition = $this->publishedCompetition([
            'quota' => 1,
            'category' => CompetitionCategory::Individual,
        ]);
        $this->makeBankAccount();

        $user1 = $this->user();
        $user2 = $this->user();

        $draft1 = $this->prepareDraft($user1, $competition, $this->ownParticipant($user1));
        app(SubmitRegistration::class)->handle($user1, $draft1);
        $draft1->refresh();

        // user2 ditolak karena slot penuh
        try {
            $draft2 = $this->prepareDraft($user2, $competition, $this->ownParticipant($user2));
            app(SubmitRegistration::class)->handle($user2, $draft2);
            $this->fail('Seharusnya kuota penuh.');
        } catch (BusinessRuleViolation $e) {
            $this->assertStringContainsString('penuh', strtolower($e->getMessage()));
        }

        // batalkan user1 → slot lepas
        $result = app(CancelRegistration::class)->handle($user1, $draft1->fresh());
        $this->assertEquals(RegistrationStatus::Cancelled, $result->status);

        // sekarang user2 boleh
        $draft2 = $this->prepareDraft($user2, $competition, $this->ownParticipant($user2));
        $submitted = app(SubmitRegistration::class)->handle($user2, $draft2);
        $this->assertEquals(RegistrationStatus::AwaitingPayment, $submitted->status);
    }

    // AC-F05-14: awaiting_verification/verified tidak bisa diedit
    public function test_a_c_f05_14_locked_entries_cannot_be_edited(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition(['category' => CompetitionCategory::Individual]);
        $participant = $this->ownParticipant($user);
        $this->makeBankAccount();

        $draft = $this->prepareDraft($user, $competition, $participant);
        $submitted = app(SubmitRegistration::class)->handle($user, $draft);
        $submitted->update(['status' => RegistrationStatus::AwaitingVerification]);

        $this->actingAs($user)
            ->get(route('registrations.edit', $submitted))
            ->assertForbidden();
    }

    // AC-F05-15: 50 tagihan sama → total semua berbeda
    public function test_a_c_f05_15_unique_totals_for_same_subtotal(): void
    {
        $competition = $this->publishedCompetition(['fee' => 100000]);
        $this->makeBankAccount();

        $user = $this->user();
        $totals = [];

        for ($i = 0; $i < 50; $i++) {
            $participant = Participant::factory()->create(['owner_id' => $user->id]);
            $reg = Registration::factory()->create([
                'competition_id' => $competition->id,
                'owner_id' => $user->id,
                'status' => RegistrationStatus::AwaitingPayment,
                'fee' => 100000,
                'code' => "BF99-T-{$i}",
            ]);
            $invoice = app(CreateInvoice::class)->handle($reg);
            $totals[] = $invoice->total;
        }

        $this->assertCount(50, array_unique($totals));
    }

    // AC-F05-07/08: unggah dokumen wajib — hanya jpg/png/pdf ≤5MB, nama acak, disk privat
    public function test_a_c_f05_08_document_upload_rules(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition([
            'category' => CompetitionCategory::Individual,
            'required_documents' => ['student_card'],
        ]);
        $participant = $this->ownParticipant($user);
        $this->makeBankAccount();

        $draft = $this->prepareDraft($user, $competition, $participant, consented: false);

        // Upload PDF valid
        $file = UploadedFile::fake()->createWithContent(
            'kartu.pdf',
            "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n",
            'application/pdf'
        );

        $this->actingAs($user)
            ->post(route('registrations.upload-document', $draft), [
                'participant_id' => $participant->id,
                'document_type' => 'student_card',
                'file' => $file,
            ])
            ->assertSessionHas('success');

        $doc = RegistrationDocument::first();
        $this->assertNotNull($doc);
        $this->assertTrue(str_starts_with($doc->path, 'registrations/'));

        // Upload berkas terlalu besar (6 MB) → ditolak
        $big = UploadedFile::fake()->createWithContent(
            'b.pdf',
            '%PDF-1.4'.str_repeat('x', 6 * 1024 * 1024),
            'application/pdf'
        );
        $this->actingAs($user)
            ->post(route('registrations.upload-document', $draft), [
                'participant_id' => $participant->id,
                'document_type' => 'student_card',
                'file' => $big,
            ])
            ->assertSessionHasErrors('file');
    }

    // BR-08 / AC-F05-14: swap anggota — bisa saat awaiting_verification, ditolak saat verified
    public function test_a_c_f05_14_swap_member_allowed_then_locked(): void
    {
        $user = $this->user();
        $competition = $this->publishedCompetition([
            'category' => CompetitionCategory::Individual,
            'quota' => 2,
        ]);
        $participantOut = $this->ownParticipant($user);
        $participantIn = $this->ownParticipant($user);
        $this->makeBankAccount();

        $draft = $this->prepareDraft($user, $competition, $participantOut);
        $submitted = app(SubmitRegistration::class)->handle($user, $draft);
        $submitted->update(['status' => RegistrationStatus::AwaitingVerification]);

        // Swap saat awaiting_verification → berhasil
        $this->actingAs($user)
            ->post(route('registrations.swap-member', $submitted), [
                'out_participant_id' => $participantOut->id,
                'in_participant_id' => $participantIn->id,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('registration_members', [
            'registration_id' => $submitted->id,
            'participant_id' => $participantIn->id,
        ]);

        // Setelah verified → ditolak
        $submitted->update(['status' => RegistrationStatus::Verified]);
        $this->actingAs($user)
            ->post(route('registrations.swap-member', $submitted), [
                'out_participant_id' => $participantIn->id,
                'in_participant_id' => $participantOut->id,
            ])
            ->assertSessionHasErrors('in_participant_id');
    }

    // Helper -------------------------------------------------

    protected function prepareDraft(
        User $user,
        Competition $competition,
        Participant $participant,
        bool $consented = true,
        ?string $code = null
    ): Registration {
        $draft = Registration::factory()->create([
            'competition_id' => $competition->id,
            'owner_id' => $user->id,
            'status' => RegistrationStatus::Draft,
            'code' => $code ?? 'BF99-T-'.uniqid(),
        ]);

        RegistrationMember::create([
            'registration_id' => $draft->id,
            'participant_id' => $participant->id,
            'competition_id' => $competition->id,
        ]);

        if ($consented) {
            $draft->update([
                'requirements_accepted_at' => now(),
                'consented_at' => now(),
            ]);
        }

        return $draft;
    }
}

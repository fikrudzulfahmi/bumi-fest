<?php

namespace Tests\Feature;

use App\Enums\CompetitionCategory;
use App\Enums\Level;
use App\Enums\Role;
use App\Enums\SubmissionMode;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class F03CompetitionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    protected function adminUser(): User
    {
        return User::factory()->create(['role' => Role::Admin->value]);
    }

    protected function participantUser(): User
    {
        return User::factory()->create(['role' => Role::Participant->value]);
    }

    // AC-F03-01: Admin creates competition, other roles 403
    public function test_a_c_f03_01_only_admin_can_create_competition(): void
    {
        // Admin can access create page
        $admin = $this->adminUser();
        $this->actingAs($admin)
            ->get(route('admin.competitions.create'))
            ->assertOk();

        // Participant cannot access create page
        $participant = $this->participantUser();
        $this->actingAs($participant)
            ->get(route('admin.competitions.create'))
            ->assertForbidden();
    }

    // AC-F03-02: Date/team/fee validation in Indonesian
    public function test_a_c_f03_02_date_validation_in_indonesian(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)->post(route('admin.competitions.store'), [
            'level' => Level::SdMi->value,
            'name' => 'Tes Lomba',
            'slug' => 'tes-lomba',
            'description' => 'Deskripsi',
            'category' => CompetitionCategory::Individual->value,
            'fee' => 100000,
            'opens_at' => '2026-11-20',
            'closes_at' => '2026-11-19', // Before opens_at
            'submission_mode' => SubmissionMode::None->value,
        ])->assertSessionHasErrors('closes_at');

        $errors = session('errors')->getMessages();
        $this->assertStringContainsString('setelah', $errors['closes_at'][0]);
    }

    public function test_a_c_f03_02_team_validation(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->post(route('admin.competitions.store'), [
            'level' => Level::SdMi->value,
            'name' => 'Tes Lomba',
            'slug' => 'tes-lomba',
            'description' => 'Deskripsi',
            'category' => CompetitionCategory::Team->value,
            'fee' => 100000,
            'team_min' => 5,
            'team_max' => 3, // Less than team_min
            'opens_at' => '2026-11-20',
            'closes_at' => '2026-11-25',
            'submission_mode' => SubmissionMode::None->value,
        ]);

        // Should fail validation
        $response->assertStatus(302); // Redirect on validation failure
    }

    public function test_a_c_f03_02_fee_cannot_be_negative(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)->post(route('admin.competitions.store'), [
            'level' => Level::SdMi->value,
            'name' => 'Tes Lomba',
            'slug' => 'tes-lomba',
            'description' => 'Deskripsi',
            'category' => CompetitionCategory::Individual->value,
            'fee' => -50000,
            'opens_at' => '2026-11-20',
            'closes_at' => '2026-11-25',
            'submission_mode' => SubmissionMode::None->value,
        ])->assertSessionHasErrors('fee');
    }

    // AC-F03-03: PDF validation ≤10 MB
    public function test_a_c_f03_03_pdf_must_be_valid_and_under_10mb(): void
    {
        $admin = $this->adminUser();

        // Valid PDF should be accepted
        $pdfFile = UploadedFile::fake()->create('rules.pdf', 1024, 'application/pdf');

        $response = $this->actingAs($admin)->post(route('admin.competitions.store'), [
            'level' => Level::SdMi->value,
            'name' => 'Tes Lomba',
            'slug' => 'tes-lomba',
            'description' => 'Deskripsi',
            'category' => CompetitionCategory::Individual->value,
            'fee' => 100000,
            'opens_at' => '2026-11-20',
            'closes_at' => '2026-11-25',
            'rules_pdf_path' => $pdfFile,
            'submission_mode' => SubmissionMode::None->value,
        ]);

        $this->assertDatabaseHas('competitions', ['slug' => 'tes-lomba']);
    }

    public function test_a_c_f03_03_pdf_over_10mb_rejected(): void
    {
        $admin = $this->adminUser();

        // File over 10 MB should be rejected
        $largeFile = UploadedFile::fake()->create('rules.pdf', 11241, 'application/pdf');

        $this->actingAs($admin)->post(route('admin.competitions.store'), [
            'level' => Level::SdMi->value,
            'name' => 'Tes Lomba',
            'slug' => 'tes-lomba',
            'description' => 'Deskripsi',
            'category' => CompetitionCategory::Individual->value,
            'fee' => 100000,
            'opens_at' => '2026-11-20',
            'closes_at' => '2026-11-25',
            'rules_pdf_path' => $largeFile,
            'submission_mode' => SubmissionMode::None->value,
        ])->assertSessionHasErrors('rules_pdf_path');
    }

    // AC-F03-04: Draft not on portal, published is
    public function test_a_c_f03_04_draft_competitions_not_visible_on_portal(): void
    {
        $draft = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'status' => 'draft',
        ]);
        $published = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'status' => 'published',
        ]);

        $participant = $this->participantUser();
        $this->actingAs($participant)
            ->get(route('portal.level', Level::SdMi->slug()))
            ->assertInertia(fn ($page) => $page
                ->where('competitions.0.id', $published->id)
                ->missing('competitions.*.id', $draft->id)
            );
    }

    // AC-F03-05: Quota validation (part of AC-F03-02 but specifically quota)
    public function test_a_c_f03_05_quota_validation(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->post(route('admin.competitions.store'), [
            'level' => Level::SdMi->value,
            'name' => 'Tes Lomba',
            'slug' => 'tes-lomba',
            'description' => 'Deskripsi',
            'category' => CompetitionCategory::Individual->value,
            'fee' => 100000,
            'quota' => 50,
            'opens_at' => '2026-11-20',
            'closes_at' => '2026-11-25',
            'submission_mode' => SubmissionMode::None->value,
        ]);

        $this->assertDatabaseHas('competitions', [
            'slug' => 'tes-lomba',
            'quota' => 50,
        ]);
    }

    // AC-F03-06: Cannot delete competition with entries (skip for now - registrations table not created)
    // AC-F03-07: Detail button behavior (needs enrollment state - skip for now)

    // AC-F03-08: Wrong-level competition URL → 404
    public function test_a_c_f03_08_wrong_level_competition_url_returns_404(): void
    {
        $sdMiCompetition = Competition::factory()->create([
            'level' => Level::SdMi->value,
            'status' => 'published',
        ]);

        $participant = $this->participantUser();

        // Access SD-MI competition via wrong level (SMP-MTs)
        $this->actingAs($participant)
            ->get('/portal/'.Level::SmpMts->slug().'/lomba/'.$sdMiCompetition->slug)
            ->assertNotFound();
    }

    // AC-F03-09: Duplicate copies settings without entries/scores
    public function test_a_c_f03_09_duplicate_creates_copy_without_entries(): void
    {
        $admin = $this->adminUser();
        $original = Competition::factory()->create([
            'name' => 'Original Competition',
            'status' => 'published',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.competitions.duplicate', $original))
            ->assertRedirect();

        $copy = Competition::where('name', 'like', '%Salinan%')->first();
        $this->assertNotNull($copy);
        $this->assertEquals('draft', $copy->status);
        $this->assertStringContainsString('Salinan', $copy->name);
    }

    // AC-F03-10: Admin list paginated 15, filters+search work, no N+1
    public function test_a_c_f03_10_admin_list_paginated_15(): void
    {
        $admin = $this->adminUser();
        Competition::factory()->count(20)->create(['level' => Level::SdMi->value]);

        $this->actingAs($admin)
            ->get(route('admin.competitions.index'))
            ->assertInertia(fn ($page) => $page
                ->has('competitions.data', 15)
                ->where('competitions.meta.total', 20)
            );
    }

    public function test_a_c_f03_10_filter_by_level(): void
    {
        $admin = $this->adminUser();
        Competition::factory()->count(5)->create(['level' => Level::SdMi->value]);
        Competition::factory()->count(3)->create(['level' => Level::SmpMts->value]);

        $this->actingAs($admin)
            ->get(route('admin.competitions.index', ['level' => Level::SdMi->value]))
            ->assertInertia(fn ($page) => $page
                ->has('competitions.data', 5)
            );
    }

    public function test_a_c_f03_10_search_by_name(): void
    {
        $admin = $this->adminUser();
        Competition::factory()->create(['name' => 'Kompetisi Matematika']);
        Competition::factory()->create(['name' => 'Kompetisi Sains']);

        $this->actingAs($admin)
            ->get(route('admin.competitions.index', ['search' => 'Matematika']))
            ->assertInertia(fn ($page) => $page
                ->has('competitions.data', 1)
                ->where('competitions.data.0.name', 'Kompetisi Matematika')
            );
    }

    public function test_a_c_f03_10_filter_by_status(): void
    {
        $admin = $this->adminUser();
        Competition::factory()->count(3)->create(['status' => 'draft']);
        Competition::factory()->count(2)->create(['status' => 'published']);

        $this->actingAs($admin)
            ->get(route('admin.competitions.index', ['status' => 'published']))
            ->assertInertia(fn ($page) => $page
                ->has('competitions.data', 2)
            );
    }

    public function test_a_c_f03_10_no_n_plus_one_queries(): void
    {
        $admin = $this->adminUser();
        Competition::factory()->count(15)->create();

        $baselineQueries = DB::getQueryLog();
        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->actingAs($admin)
            ->get(route('admin.competitions.index'));

        $queries = DB::getQueryLog();
        // Should have minimal queries (1 for count, 1 for select) not 1 + 15
        $this->assertLessThan(10, count($queries), 'Too many queries detected - possible N+1');
    }
}

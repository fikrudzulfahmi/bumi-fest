<?php

namespace Tests\Feature;

use App\Enums\Level;
use App\Enums\Role;
use App\Models\Announcement;
use App\Models\User;
use App\Services\Settings\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class F04SettingsAnnouncementTest extends TestCase
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
        return User::factory()->create([
            'role' => Role::Participant->value,
            'preferred_level' => Level::SdMi->value,
        ]);
    }

    // AC-F04-04: Pengaturan tersimpan, cache bersih, nilai di luar rentang ditolak
    public function test_a_c_f04_04_settings_persist_and_cache_cleared(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)->put(route('admin.settings.update'), [
            'event_name' => 'Bumifest 2026',
            'contact_whatsapp' => '628123456789',
            'contact_email' => 'panitia@bumifest.test',
            'payment_due_hours' => 24,
            'max_competitions_per_participant' => 3,
            'import_max_rows' => 500,
        ])->assertRedirect(route('admin.settings.edit'));

        // Cache harus di-forget → nilai baru langsung terbaca
        $this->assertSame('Bumifest 2026', Settings::get('event_name'));
        $this->assertSame(24, Settings::get('payment_due_hours'));
        $this->assertSame(500, Settings::get('import_max_rows'));

        $this->assertDatabaseHas('settings', ['key' => 'event_name']);
    }

    public function test_a_c_f04_04_payment_due_hours_out_of_range_rejected(): void
    {
        $admin = $this->adminUser();

        foreach ([0, 721, -5] as $invalid) {
            $this->actingAs($admin)->put(route('admin.settings.update'), [
                'event_name' => 'Bumifest',
                'contact_whatsapp' => '628123456789',
                'contact_email' => 'a@b.test',
                'payment_due_hours' => $invalid,
                'import_max_rows' => 300,
            ])->assertSessionHasErrors('payment_due_hours');
        }
    }

    public function test_a_c_f04_04_non_admin_cannot_update_settings(): void
    {
        $participant = $this->participantUser();

        $this->actingAs($participant)
            ->put(route('admin.settings.update'), ['event_name' => 'Hack'])
            ->assertForbidden();
    }

    // AC-F04-05: Pengumuman terbit tampil di portal sesuai jenjang; draf tidak
    public function test_a_c_f04_05_published_announcement_visible_draft_hidden(): void
    {
        $author = $this->adminUser();

        $published = Announcement::factory()->create([
            'level' => Level::SdMi->value,
            'title' => 'Pengumuman Terbit',
            'published_at' => now('Asia/Jakarta')->subDay(),
            'author_id' => $author->id,
        ]);

        $draft = Announcement::factory()->create([
            'level' => Level::SdMi->value,
            'title' => 'Draf Tersembunyi',
            'published_at' => null,
            'author_id' => $author->id,
        ]);

        $participant = $this->participantUser();

        $this->actingAs($participant)
            ->get(route('portal.level', Level::SdMi->slug()))
            ->assertInertia(fn ($page) => $page
                ->has('announcements', 1)
                ->where('announcements.0.title', $published->title)
            );
    }

    public function test_a_c_f04_05_announcement_scoped_by_level(): void
    {
        $author = $this->adminUser();

        Announcement::factory()->create([
            'level' => Level::SmpMts->value,
            'title' => 'Khusus SMP',
            'published_at' => now('Asia/Jakarta')->subDay(),
            'author_id' => $author->id,
        ]);

        Announcement::factory()->create([
            'level' => Level::SdMi->value,
            'title' => 'Khusus SD',
            'published_at' => now('Asia/Jakarta')->subDay(),
            'author_id' => $author->id,
        ]);

        $participant = $this->participantUser();

        $this->actingAs($participant)
            ->get(route('portal.level', Level::SdMi->slug()))
            ->assertInertia(fn ($page) => $page
                ->has('announcements', 1)
                ->where('announcements.0.title', 'Khusus SD')
            );
    }

    public function test_a_c_f04_05_admin_can_publish_and_unpublish_announcement(): void
    {
        $admin = $this->adminUser();
        $announcement = Announcement::factory()->create([
            'level' => null,
            'published_at' => null,
            'author_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.announcements.publish', $announcement))
            ->assertRedirect(route('admin.announcements.index'));

        $this->assertNotNull($announcement->fresh()->published_at);

        $this->actingAs($admin)
            ->post(route('admin.announcements.unpublish', $announcement))
            ->assertRedirect(route('admin.announcements.index'));

        $this->assertNull($announcement->fresh()->published_at);
    }

    public function test_a_c_f04_05_non_admin_cannot_manage_announcements(): void
    {
        $participant = $this->participantUser();

        $this->actingAs($participant)
            ->get(route('admin.announcements.index'))
            ->assertForbidden();
    }
}

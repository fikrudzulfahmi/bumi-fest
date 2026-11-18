<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class F04BankAccountTest extends TestCase
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

    // AC-F04-01: Admin can CRUD rekening; other roles 403
    public function test_a_c_f04_01_only_admin_can_view_bank_accounts(): void
    {
        $admin = $this->adminUser();
        $this->actingAs($admin)
            ->get(route('admin.bank-accounts.index'))
            ->assertOk();

        $participant = $this->participantUser();
        $this->actingAs($participant)
            ->get(route('admin.bank-accounts.index'))
            ->assertForbidden();
    }

    public function test_a_c_f04_01_admin_can_create_bank_account(): void
    {
        $admin = $this->adminUser();
        $this->actingAs($admin)
            ->get(route('admin.bank-accounts.create'))
            ->assertOk();
    }

    public function test_a_c_f04_01_participant_cannot_create_bank_account(): void
    {
        $participant = $this->participantUser();
        $this->actingAs($participant)
            ->get(route('admin.bank-accounts.create'))
            ->assertForbidden();
    }

    // AC-F04-02: Hanya rekening aktif untuk tagihan baru (ActiveBankAccount scope)
    public function test_a_c_f04_02_active_bank_account_scope_works(): void
    {
        BankAccount::factory()->count(2)->create(['is_active' => true, 'sort' => 1]);
        BankAccount::factory()->count(3)->inactive()->create(['sort' => 2]);

        $active = BankAccount::active()->get();

        $this->assertCount(2, $active);
        $this->assertTrue($active->every(fn ($a) => $a->is_active));
    }

    public function test_a_c_f04_02_active_scope_ordered_by_sort(): void
    {
        BankAccount::factory()->create(['is_active' => true, 'sort' => 10]);
        BankAccount::factory()->create(['is_active' => true, 'sort' => 5]);
        BankAccount::factory()->create(['is_active' => true, 'sort' => 15]);

        $active = BankAccount::active()->pluck('sort')->toArray();

        $this->assertEquals([5, 10, 15], $active);
    }

    // AC-F04-03: Nomor rekening hanya angka/tanda hubung, validasi Indonesia
    public function test_a_c_f04_03_account_number_validation_only_digits_and_hyphens(): void
    {
        $admin = $this->adminUser();

        // Invalid: contains letters
        $this->actingAs($admin)->post(route('admin.bank-accounts.store'), [
            'bank_name' => 'BCA',
            'account_number' => '123ABC456',
            'account_holder' => 'Test',
        ])->assertSessionHasErrors('account_number');

        // Valid: digits and hyphens
        $this->actingAs($admin)->post(route('admin.bank-accounts.store'), [
            'bank_name' => 'BCA',
            'account_number' => '123-456-789',
            'account_holder' => 'Test',
        ])->assertRedirect(route('admin.bank-accounts.index'));

        $this->assertDatabaseHas('bank_accounts', ['account_number' => '123-456-789']);
    }

    public function test_a_c_f04_03_account_number_max_length(): void
    {
        $admin = $this->adminUser();

        $this->actingAs($admin)->post(route('admin.bank-accounts.store'), [
            'bank_name' => 'BCA',
            'account_number' => str_repeat('1', 50),
            'account_holder' => 'Test',
        ])->assertSessionHasErrors('account_number');
    }

    public function test_a_c_f04_03_messages_in_indonesian(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->post(route('admin.bank-accounts.store'), [
            'account_number' => '123ABC',
            'bank_name' => '',
            'account_holder' => '',
        ]);

        $response->assertSessionHasErrors();
        $errors = session('errors')->getMessages();
        $this->assertStringContainsString('harus', $errors['bank_name'][0]);
        $this->assertStringContainsString('angka', $errors['account_number'][0]);
    }
}

<?php

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomElement([50000, 100000, 150000, 200000]);

        return [
            'number' => 'INV-'.fake()->unique()->numerify('##########'),
            'owner_id' => User::factory(),
            'subtotal' => $subtotal,
            'unique_code' => fake()->numberBetween(1, 999),
            'discount' => 0,
            'total' => $subtotal,
            'status' => InvoiceStatus::Unpaid,
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Bumifest',
            'due_at' => now()->addDays(2),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => InvoiceStatus::Paid]);
    }
}

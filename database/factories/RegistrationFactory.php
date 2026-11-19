<?php

namespace Database\Factories;

use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Registration>
 */
class RegistrationFactory extends Factory
{
    protected $model = Registration::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = 'BF'.now()->format('y').'-'.fake()->randomElement(['SD', 'SMP']).'-'
            .str_pad((string) fake()->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT);

        return [
            'code' => $code,
            'competition_id' => Competition::factory(),
            'owner_id' => User::factory(),
            'status' => RegistrationStatus::Draft,
            'fee' => 0,
        ];
    }

    public function awaitingPayment(): static
    {
        return $this->state(fn () => ['status' => RegistrationStatus::AwaitingPayment]);
    }
}

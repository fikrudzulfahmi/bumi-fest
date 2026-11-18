<?php

namespace Database\Factories;

use App\Enums\Level;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'level' => $this->faker->randomElement([null, Level::SdMi->value, Level::SmpMts->value]),
            'title' => $this->faker->sentence(),
            'body' => $this->faker->paragraphs(3, true),
            'published_at' => now()->subDays($this->faker->numberBetween(0, 7)),
            'author_id' => User::factory(),
        ];
    }

    public function general(): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => null,
        ]);
    }

    public function sdMi(): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => Level::SdMi->value,
        ]);
    }

    public function smpMts(): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => Level::SmpMts->value,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }
}

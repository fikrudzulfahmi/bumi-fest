<?php

namespace Database\Factories;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\Level;
use App\Enums\SubmissionMode;
use App\Models\Competition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Competition>
 */
class CompetitionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->word().'-'.Str::random(6);

        return [
            'level' => $this->faker->randomElement([Level::SdMi->value, Level::SmpMts->value]),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => $this->faker->sentences(3, true),
            'category' => $this->faker->randomElement([CompetitionCategory::Individual->value, CompetitionCategory::Team->value]),
            'fee' => $this->faker->numberBetween(50000, 500000),
            'quota' => $this->faker->randomElement([null, $this->faker->numberBetween(10, 100)]),
            'team_min' => $this->faker->randomElement([null, 2]),
            'team_max' => $this->faker->randomElement([null, 5]),
            'opens_at' => now()->addDays($this->faker->numberBetween(1, 7)),
            'closes_at' => now()->addDays($this->faker->numberBetween(8, 30)),
            'status' => $this->faker->randomElement([CompetitionStatus::Draft->value, CompetitionStatus::Published->value]),
            'rules_pdf_path' => null,
            'requirements' => ['Surat keterangan sekolah', 'Identitas'],
            'required_documents' => null,
            'submission_mode' => SubmissionMode::None->value,
            'submission_mimes' => null,
            'submission_max_mb' => null,
            'results_published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CompetitionStatus::Published->value,
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CompetitionStatus::Draft->value,
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
}

<?php

namespace Database\Factories;

use App\Models\Competition;
use App\Models\RubricCriterion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RubricCriterion>
 */
class RubricCriterionFactory extends Factory
{
    protected $model = RubricCriterion::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'competition_id' => Competition::factory(),
            'name' => fake()->words(2, true),
            'weight' => 25,
            'max_score' => 100,
            'sort' => fake()->numberBetween(1, 10),
        ];
    }
}

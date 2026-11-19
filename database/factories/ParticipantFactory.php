<?php

namespace Database\Factories;

use App\Models\Participant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Participant>
 */
class ParticipantFactory extends Factory
{
    protected $model = Participant::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $grade = fake()->numberBetween(1, 9);

        return [
            'owner_id' => User::factory(),
            'name' => fake()->name(),
            'grade' => $grade,
            'level' => Participant::levelForGrade($grade)->value,
            'school_name' => fake()->word().' '.fake()->word(),
            'school_city' => fake()->city(),
        ];
    }

    public function sDMi(): static
    {
        return $this->state(function () {
            $grade = fake()->numberBetween(1, 6);

            return [
                'grade' => $grade,
                'level' => Participant::levelForGrade($grade)->value,
            ];
        });
    }

    public function sMPMts(): static
    {
        return $this->state(function () {
            $grade = fake()->numberBetween(7, 9);

            return [
                'grade' => $grade,
                'level' => Participant::levelForGrade($grade)->value,
            ];
        });
    }
}

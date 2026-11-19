<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\Competition;
use App\Models\JudgeAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JudgeAssignment>
 */
class JudgeAssignmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'judge_id' => User::factory()->state(['role' => Role::Judge->value]),
            'competition_id' => Competition::factory(),
        ];
    }
}

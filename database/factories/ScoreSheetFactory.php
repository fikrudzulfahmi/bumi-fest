<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Enums\ScoreSheetStatus;
use App\Models\Registration;
use App\Models\ScoreSheet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScoreSheet>
 */
class ScoreSheetFactory extends Factory
{
    protected $model = ScoreSheet::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'registration_id' => Registration::factory(),
            'judge_id' => User::factory()->state(['role' => Role::Judge->value]),
            'note' => null,
            'status' => ScoreSheetStatus::Draft->value,
            'total' => null,
            'locked_at' => null,
        ];
    }
}

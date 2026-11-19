<?php

namespace Database\Factories;

use App\Enums\CertificateType;
use App\Models\Certificate;
use App\Models\Participant;
use App\Models\Registration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Certificate>
 */
class CertificateFactory extends Factory
{
    protected $model = Certificate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'registration_id' => Registration::factory(),
            'participant_id' => Participant::factory(),
            'type' => CertificateType::Participation->value,
            'placement' => null,
            'number' => 'BF'.now()->format('y').'-SD-'.fake()->unique()->numerify('###').'-'.fake()->unique()->numerify('####'),
            'verification_code' => strtoupper(fake()->unique()->bothify('??????????')),
            'file_path' => null,
            'generated_at' => now(),
        ];
    }
}

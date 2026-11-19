<?php

namespace Database\Factories;

use App\Enums\CertificateType;
use App\Models\CertificateTemplate;
use App\Models\Competition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CertificateTemplate>
 */
class CertificateTemplateFactory extends Factory
{
    protected $model = CertificateTemplate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'competition_id' => Competition::factory(),
            'type' => CertificateType::Participation->value,
            'image_path' => 'certificate-templates/template-'.fake()->uuid().'.png',
            'layout' => [
                'name' => ['x' => 50, 'y' => 45, 'size' => 32, 'color' => '#000000', 'align' => 'center'],
                'competition' => ['x' => 50, 'y' => 30, 'size' => 20, 'color' => '#000000', 'align' => 'center'],
                'placement' => ['x' => 50, 'y' => 55, 'size' => 18, 'color' => '#000000', 'align' => 'center'],
                'number' => ['x' => 12, 'y' => 90, 'size' => 12, 'color' => '#000000', 'align' => 'left'],
                'qr' => ['x' => 88, 'y' => 82, 'size' => 12, 'color' => '#000000'],
            ],
        ];
    }
}

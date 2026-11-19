<?php

namespace App\Models;

use App\Enums\CertificateType;
use Database\Factories\CertificateTemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $competition_id
 * @property CertificateType $type
 * @property string $image_path
 * @property array<string, mixed> $layout
 * @property-read Competition $competition
 */
class CertificateTemplate extends Model
{
    /** @use HasFactory<CertificateTemplateFactory> */
    use HasFactory;

    protected $fillable = ['competition_id', 'type', 'image_path', 'layout'];

    protected $casts = [
        'type' => CertificateType::class,
        'layout' => 'array',
    ];

    /**
     * @return BelongsTo<Competition, $this>
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}

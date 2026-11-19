<?php

namespace App\Models;

use App\Enums\CertificateType;
use Database\Factories\CertificateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $registration_id
 * @property int $participant_id
 * @property CertificateType $type
 * @property int|null $placement
 * @property string $number
 * @property string $verification_code
 * @property string|null $file_path
 * @property Carbon|null $generated_at
 * @property-read Registration $registration
 * @property-read Participant $participant
 */
class Certificate extends Model
{
    /** @use HasFactory<CertificateFactory> */
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'participant_id',
        'type',
        'placement',
        'number',
        'verification_code',
        'file_path',
        'generated_at',
    ];

    protected $casts = [
        'type' => CertificateType::class,
        'placement' => 'integer',
        'generated_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Registration, $this>
     */
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /**
     * @return BelongsTo<Participant, $this>
     */
    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }
}

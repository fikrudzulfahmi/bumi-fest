<?php

namespace App\Models;

use App\Enums\DocumentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistrationDocument extends Model
{
    protected $table = 'registration_documents';

    protected $fillable = [
        'registration_id',
        'participant_id',
        'type',
        'path',
        'original_name',
        'size',
    ];

    protected $casts = [
        'type' => DocumentType::class,
        'size' => 'integer',
    ];

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }
}

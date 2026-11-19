<?php

namespace App\Models;

use App\Enums\RegistrationStatus;
use Database\Factories\RegistrationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Registration extends Model
{
    /** @use HasFactory<RegistrationFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'competition_id',
        'owner_id',
        'invoice_id',
        'status',
        'team_name',
        'fee',
        'submission_path',
        'submission_url',
        'submission_name',
        'requirements_accepted_at',
        'consented_at',
        'submitted_at',
        'final_score',
        'placement',
    ];

    protected $casts = [
        'status' => RegistrationStatus::class,
        'fee' => 'integer',
        'final_score' => 'decimal:2',
        'placement' => 'integer',
        'requirements_accepted_at' => 'datetime',
        'consented_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Competition, $this>
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return BelongsTo<Invoice, $this>
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * @return HasMany<RegistrationMember, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(RegistrationMember::class);
    }

    /**
     * @return HasMany<RegistrationDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(RegistrationDocument::class);
    }

    /**
     * @return HasMany<ScoreSheet, $this>
     */
    public function scoreSheets(): HasMany
    {
        return $this->hasMany(ScoreSheet::class);
    }

    /**
     * @return HasMany<Certificate, $this>
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /**
     * Status yang menahan slot (BR-03).
     *
     * @return array<int, RegistrationStatus>
     */
    public static function slotHoldingStatuses(): array
    {
        return [
            RegistrationStatus::AwaitingPayment,
            RegistrationStatus::AwaitingVerification,
            RegistrationStatus::Verified,
            RegistrationStatus::Rejected,
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeSlotHolding($query)
    {
        return $query->whereIn('status', self::slotHoldingStatuses());
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForCompetition($query, int $competitionId)
    {
        return $query->where('competition_id', $competitionId);
    }
}

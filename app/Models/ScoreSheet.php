<?php

namespace App\Models;

use App\Enums\ScoreSheetStatus;
use Database\Factories\ScoreSheetFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Lembar nilai satu juri untuk satu entri (unik per pasangan).
 *
 * @property int $id
 * @property int $registration_id
 * @property int $judge_id
 * @property string|null $note
 * @property ScoreSheetStatus $status
 * @property string|null $total
 * @property Carbon|null $locked_at
 * @property-read Registration $registration
 * @property-read User $judge
 * @property-read Collection<int, Score> $scores
 */
class ScoreSheet extends Model
{
    /** @use HasFactory<ScoreSheetFactory> */
    use HasFactory;

    protected $fillable = ['registration_id', 'judge_id', 'note', 'status', 'total', 'locked_at'];

    protected $casts = [
        'status' => ScoreSheetStatus::class,
        'locked_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Registration, $this>
     */
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function judge(): BelongsTo
    {
        return $this->belongsTo(User::class, 'judge_id');
    }

    /**
     * @return HasMany<Score, $this>
     */
    public function scores(): HasMany
    {
        return $this->hasMany(Score::class);
    }
}

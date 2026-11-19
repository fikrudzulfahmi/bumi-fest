<?php

namespace App\Models;

use Database\Factories\JudgeAssignmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Penugasan juri ke lomba (AC-F10-03: unik per pasangan juri–lomba).
 *
 * @property int $id
 * @property int $judge_id
 * @property int $competition_id
 * @property-read User $judge
 * @property-read Competition $competition
 */
class JudgeAssignment extends Model
{
    /** @use HasFactory<JudgeAssignmentFactory> */
    use HasFactory;

    protected $fillable = ['judge_id', 'competition_id'];

    /**
     * @return BelongsTo<User, $this>
     */
    public function judge(): BelongsTo
    {
        return $this->belongsTo(User::class, 'judge_id');
    }

    /**
     * @return BelongsTo<Competition, $this>
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}

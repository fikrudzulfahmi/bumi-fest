<?php

namespace App\Models;

use Database\Factories\RubricCriterionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Kriteria rubrik per lomba (AC-F10-04: bobot bulat ≥ 1, total 100 = siap).
 *
 * @property int $id
 * @property int $competition_id
 * @property string $name
 * @property int $weight
 * @property int $max_score
 * @property int $sort
 * @property-read Competition $competition
 */
class RubricCriterion extends Model
{
    /** @use HasFactory<RubricCriterionFactory> */
    use HasFactory;

    protected $fillable = ['competition_id', 'name', 'weight', 'max_score', 'sort'];

    protected $casts = [
        'weight' => 'integer',
        'max_score' => 'integer',
        'sort' => 'integer',
    ];

    /**
     * @return BelongsTo<Competition, $this>
     */
    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}

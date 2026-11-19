<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Nilai satu kriteria pada satu lembar nilai.
 *
 * @property int $id
 * @property int $score_sheet_id
 * @property int $criterion_id
 * @property string $value
 * @property-read ScoreSheet $sheet
 * @property-read RubricCriterion $criterion
 */
class Score extends Model
{
    protected $fillable = ['score_sheet_id', 'criterion_id', 'value'];

    /**
     * @return BelongsTo<ScoreSheet, $this>
     */
    public function sheet(): BelongsTo
    {
        return $this->belongsTo(ScoreSheet::class, 'score_sheet_id');
    }

    /**
     * @return BelongsTo<RubricCriterion, $this>
     */
    public function criterion(): BelongsTo
    {
        return $this->belongsTo(RubricCriterion::class, 'criterion_id');
    }
}

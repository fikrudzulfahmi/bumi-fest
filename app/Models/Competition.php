<?php

namespace App\Models;

use Database\Factories\CompetitionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Competition extends Model
{
    /** @use HasFactory<CompetitionFactory> */
    use HasFactory;

    protected $fillable = [
        'level',
        'name',
        'slug',
        'description',
        'category',
        'fee',
        'quota',
        'team_min',
        'team_max',
        'opens_at',
        'closes_at',
        'status',
        'rules_pdf_path',
        'requirements',
        'required_documents',
        'submission_mode',
        'submission_mimes',
        'submission_max_mb',
        'results_published_at',
    ];

    protected $casts = [
        'opens_at' => 'datetime',
        'closes_at' => 'datetime',
        'results_published_at' => 'datetime',
        'requirements' => 'array',
        'required_documents' => 'array',
        'submission_mimes' => 'array',
    ];

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeByLevel($query, string $level)
    {
        return $query->where('level', $level);
    }
}

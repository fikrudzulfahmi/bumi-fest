<?php

namespace App\Models;

use Database\Factories\CompetitionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

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

    /**
     * @return HasMany<RubricCriterion, $this>
     */
    public function rubricCriteria(): HasMany
    {
        return $this->hasMany(RubricCriterion::class)->orderBy('sort')->orderBy('id');
    }

    /**
     * @return HasMany<JudgeAssignment, $this>
     */
    public function judgeAssignments(): HasMany
    {
        return $this->hasMany(JudgeAssignment::class);
    }

    /**
     * @return HasMany<CertificateTemplate, $this>
     */
    public function certificateTemplates(): HasMany
    {
        return $this->hasMany(CertificateTemplate::class);
    }

    /**
     * @return HasManyThrough<Certificate, Registration, $this>
     */
    public function certificates(): HasManyThrough
    {
        return $this->hasManyThrough(Certificate::class, Registration::class, 'competition_id', 'registration_id');
    }

    /**
     * @return HasMany<Registration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * @return HasManyThrough<ScoreSheet, Registration, $this>
     */
    public function scoreSheets(): HasManyThrough
    {
        return $this->hasManyThrough(ScoreSheet::class, Registration::class);
    }
}

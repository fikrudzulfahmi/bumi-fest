<?php

namespace App\Models;

use App\Enums\Level;
use Database\Factories\ParticipantFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Participant extends Model
{
    /** @use HasFactory<ParticipantFactory> */
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'institution_id',
        'name',
        'grade',
        'level',
        'school_name',
        'school_city',
    ];

    protected $casts = [
        'grade' => 'integer',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function registrations(): BelongsToMany
    {
        return $this->belongsToMany(Registration::class, 'registration_members')
            ->withPivot('position')
            ->withTimestamps();
    }

    /**
     * @return HasMany<Certificate, $this>
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /**
     * Jenjang otomatis dari kelas (BR-01): 1–6 = SD/MI, 7–9 = SMP/MTs.
     */
    public static function levelForGrade(int $grade): Level
    {
        return $grade <= 6 ? Level::SdMi : Level::SmpMts;
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForOwner($query, int $ownerId)
    {
        return $query->where('owner_id', $ownerId);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForLevel($query, string $level)
    {
        return $query->where('level', $level);
    }
}

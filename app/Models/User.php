<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $whatsapp
 * @property string|null $preferred_level
 * @property Role $role
 * @property bool $is_active
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $privacy_consented_at
 * @property-read Institution|null $institution
 * @property-read Collection<int, Registration> $registrations
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'preferred_level',
        'whatsapp',
        'is_active',
        'privacy_consented_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'is_active' => 'boolean',
            'privacy_consented_at' => 'datetime',
        ];
    }

    /**
     * @return HasOne<Institution, $this>
     */
    public function institution(): HasOne
    {
        return $this->hasOne(Institution::class);
    }

    /**
     * @return HasMany<Registration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class, 'owner_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    public function isJudge(): bool
    {
        return $this->role === Role::Judge;
    }

    public function isInstitution(): bool
    {
        return $this->role === Role::Institution;
    }

    /**
     * Default landing page after login, per role.
     */
    public function homeRoute(): string
    {
        $role = $this->role;

        return match ($role) {
            Role::Admin => '/admin',
            Role::Judge => '/juri',
            default => '/portal',
        };
    }
}

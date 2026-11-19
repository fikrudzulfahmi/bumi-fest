<?php

namespace App\Queries;

use App\Enums\RegistrationStatus;
use App\Models\Registration;
use Illuminate\Database\Eloquent\Builder;

/**
 * Satu sumber filter untuk daftar, ekspor sinkron, dan job ekspor
 * (AC-F09-02, AC-F09-03). Dipakai controller & job agar hasil identik.
 */
class RegistrationQuery
{
    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<Registration>
     */
    public static function apply(array $filters): Builder
    {
        $level = (string) ($filters['level'] ?? '');
        $status = (string) ($filters['status'] ?? '');
        $competitionId = (int) ($filters['competition_id'] ?? 0);
        $institutionId = (int) ($filters['institution_id'] ?? 0);
        $search = trim((string) ($filters['q'] ?? ''));

        return Registration::query()
            ->when($level !== '', fn (Builder $query) => $query->whereHas(
                'competition',
                fn (Builder $q) => $q->where('level', $level)
            ))
            ->when(
                $status !== '' && in_array($status, array_column(RegistrationStatus::cases(), 'value'), true),
                fn (Builder $query) => $query->where('registrations.status', $status)
            )
            ->when($competitionId > 0, fn (Builder $query) => $query->where('registrations.competition_id', $competitionId))
            ->when($institutionId > 0, fn (Builder $query) => $query->whereHas(
                'members.participant',
                fn (Builder $q) => $q->where('participants.institution_id', $institutionId)
            ))
            ->when($search !== '', fn (Builder $query) => $query->where(function (Builder $q) use ($search) {
                $q->where('registrations.code', 'like', '%'.$search.'%')
                    ->orWhere('registrations.team_name', 'like', '%'.$search.'%')
                    ->orWhereHas('owner', fn (Builder $o) => $o->where('name', 'like', '%'.$search.'%'))
                    ->orWhereHas('members.participant', fn (Builder $p) => $p
                        ->where('participants.name', 'like', '%'.$search.'%')
                        ->orWhere('participants.school_name', 'like', '%'.$search.'%'));
            }));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public static function normalize(array $filters): array
    {
        return [
            'level' => (string) ($filters['level'] ?? ''),
            'status' => (string) ($filters['status'] ?? ''),
            'competition_id' => (int) ($filters['competition_id'] ?? 0),
            'institution_id' => (int) ($filters['institution_id'] ?? 0),
            'q' => trim((string) ($filters['q'] ?? '')),
        ];
    }
}

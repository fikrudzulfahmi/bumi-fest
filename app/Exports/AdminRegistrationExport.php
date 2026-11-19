<?php

namespace App\Exports;

use App\Models\Registration;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * AC-F09-03: kolom kode, siswa, kelas, sekolah, lomba, status, tagihan.
 * Mengikuti filter aktif dari daftar admin.
 *
 * @implements WithMapping<Registration>
 */
class AdminRegistrationExport implements FromQuery, WithHeadings, WithMapping
{
    /**
     * @param  Builder<Registration>  $query
     */
    public function __construct(private readonly Builder $query) {}

    /**
     * @return Builder<Registration>
     */
    public function query(): Builder
    {
        return $this->query;
    }

    /**
     * @return list<string>
     */
    public function headings(): array
    {
        return [
            'Kode',
            'Siswa',
            'Kelas',
            'Sekolah',
            'Lomba',
            'Jenjang',
            'Status',
            'Tagihan',
            'Total',
        ];
    }

    /**
     * @param  Registration  $registration
     * @return list<string|int|null>
     */
    public function map($registration): array
    {
        $members = $registration->members;

        $names = $members->map(fn ($m) => $m->participant?->name)->filter()->implode(', ');
        $grades = $members->map(fn ($m) => $m->participant?->grade)->filter()->unique()->implode(', ');
        $schools = $members->map(fn ($m) => $m->participant?->school_name)->filter()->unique()->implode(', ');

        return [
            $registration->code,
            $names,
            $grades,
            $schools,
            $registration->competition?->name,
            $registration->competition?->level,
            $registration->status->label(),
            $registration->invoice?->number,
            $registration->invoice?->total,
        ];
    }
}

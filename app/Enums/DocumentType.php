<?php

namespace App\Enums;

enum DocumentType: string
{
    case StudentCard = 'student_card';
    case SchoolLetter = 'school_letter';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::StudentCard => 'Kartu Pelajar',
            self::SchoolLetter => 'Surat Keterangan Sekolah',
            self::Other => 'Lainnya',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::StudentCard => 'blue',
            self::SchoolLetter => 'purple',
            self::Other => 'gray',
        };
    }
}

<?php

namespace App\Enums;

enum SubmissionMode: string
{
    case None = 'none';
    case File = 'file';
    case Link = 'link';

    public function label(): string
    {
        return match ($this) {
            self::None => 'Tidak Ada',
            self::File => 'Berkas',
            self::Link => 'Tautan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::None => 'gray',
            self::File => 'blue',
            self::Link => 'purple',
        };
    }
}

<?php

namespace App\Enums;

enum CertificateType: string
{
    case Winner = 'winner';
    case Participation = 'participation';

    public function label(): string
    {
        return match ($this) {
            self::Winner => 'Juara',
            self::Participation => 'Partisipasi',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Winner => 'yellow',
            self::Participation => 'blue',
        };
    }
}

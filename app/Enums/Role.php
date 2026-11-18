<?php

namespace App\Enums;

enum Role: string
{
    case Participant = 'participant';
    case Institution = 'institution';
    case Judge = 'judge';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Participant => 'Peserta',
            self::Institution => 'Lembaga',
            self::Judge => 'Juri',
            self::Admin => 'Admin',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Participant => 'blue',
            self::Institution => 'purple',
            self::Judge => 'amber',
            self::Admin => 'red',
        };
    }
}

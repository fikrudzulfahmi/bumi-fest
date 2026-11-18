<?php

namespace App\Enums;

enum ScoreSheetStatus: string
{
    case Draft = 'draft';
    case Locked = 'locked';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Locked => 'Terkunci',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Locked => 'red',
        };
    }
}

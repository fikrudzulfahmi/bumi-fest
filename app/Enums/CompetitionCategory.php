<?php

namespace App\Enums;

enum CompetitionCategory: string
{
    case Individual = 'individual';
    case Team = 'team';

    public function label(): string
    {
        return match ($this) {
            self::Individual => 'Individu',
            self::Team => 'Tim',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Individual => 'sky',
            self::Team => 'emerald',
        };
    }
}

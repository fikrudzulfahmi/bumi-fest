<?php

namespace App\Enums;

enum Level: string
{
    case SdMi = 'sd_mi';
    case SmpMts = 'smp_mts';

    public function label(): string
    {
        return match ($this) {
            self::SdMi => 'SD/MI',
            self::SmpMts => 'SMP/MTs',
        };
    }

    public function slug(): string
    {
        return match ($this) {
            self::SdMi => 'sd-mi',
            self::SmpMts => 'smp-mts',
        };
    }

    public static function fromSlug(string $slug): ?self
    {
        return match ($slug) {
            'sd-mi' => self::SdMi,
            'smp-mts' => self::SmpMts,
            default => null,
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SdMi => 'green',
            self::SmpMts => 'indigo',
        };
    }
}

<?php

namespace App\Services\Settings;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class Settings
{
    private const CACHE_KEY = 'bumifest_settings';

    private const CACHE_TTL = 3600;

    public static function get(string $key, mixed $default = null): mixed
    {
        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn () => self::loadFromDb());

        return $settings[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => json_encode($value)]
        );

        Cache::forget(self::CACHE_KEY);
    }

    /**
     * @return array<string, mixed>
     */
    private static function loadFromDb(): array
    {
        /** @var array<string, mixed> $settings */
        $settings = Setting::pluck('value', 'key')
            ->map(fn ($value) => json_decode((string) $value, true))
            ->toArray();

        return $settings;
    }
}

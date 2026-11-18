<?php

namespace App\Actions\Setting;

use App\Services\Settings\Settings;
use Illuminate\Support\Facades\DB;

class UpdateSettings
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): void
    {
        DB::transaction(function () use ($data) {
            foreach ($data as $key => $value) {
                Settings::set($key, $value);
            }
        });
    }
}

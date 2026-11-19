<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// AC-F07-09: jalankan tiap jam
Schedule::command('invoices:expire')->hourly();

// AC-F13-04: backup harian + bersihkan cadangan lama
Schedule::command('backup:run --only-db')->dailyAt('02:30');
Schedule::command('backup:clean')->dailyAt('03:30');

Artisan::command('inspire', function () {
    $this->comment('Bumifest siap.');
})->purpose('Display an inspiring quote');

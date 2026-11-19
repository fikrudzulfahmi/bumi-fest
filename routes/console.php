<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// AC-F07-09: jalankan tiap jam
Schedule::command('invoices:expire')->hourly();

Artisan::command('inspire', function () {
    $this->comment('Bumifest siap.');
})->purpose('Display an inspiring quote');

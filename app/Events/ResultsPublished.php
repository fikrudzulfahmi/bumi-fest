<?php

namespace App\Events;

use App\Models\Competition;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dipicu saat admin menerbitkan hasil lomba (F11). Pemicu notifikasi peserta
 * dan pembuatan sertifikat (F12).
 */
class ResultsPublished
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Competition $competition,
    ) {}
}

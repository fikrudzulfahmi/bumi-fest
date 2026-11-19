<?php

namespace App\Events;

use App\Models\Registration;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dipicu saat sertifikat satu entri selesai dibuat (F12).
 */
class CertificateReady
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Registration $registration,
    ) {}
}

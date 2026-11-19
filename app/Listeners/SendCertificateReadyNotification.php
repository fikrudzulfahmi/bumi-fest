<?php

namespace App\Listeners;

use App\Events\CertificateReady;
use App\Notifications\CertificateReadyNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * AC-F12-10: beri tahu pemilik entri saat sertifikat siap diunduh.
 */
class SendCertificateReadyNotification implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(CertificateReady $event): void
    {
        $owner = $event->registration->owner;

        if ($owner === null) {
            return;
        }

        $owner->notify(new CertificateReadyNotification($event->registration));

        $this->whatsapp->send(
            $owner,
            'Sertifikat untuk entri '.$event->registration->code.' sudah siap diunduh di portal Bumifest.',
        );
    }
}

<?php

namespace App\Listeners;

use App\Events\InvoiceVerified;
use App\Notifications\InvoiceVerifiedNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendInvoiceVerifiedNotification implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(InvoiceVerified $event): void
    {
        $invoice = $event->invoice->loadMissing('owner');
        $owner = $invoice->owner;

        if ($owner === null) {
            return;
        }

        $owner->notify(new InvoiceVerifiedNotification($invoice));

        $this->whatsapp->send(
            $owner,
            'Pembayaran '.$invoice->number.' sudah diverifikasi. Pendaftaran Anda aktif.'
        );
    }
}

<?php

namespace App\Listeners;

use App\Events\InvoiceExpired;
use App\Notifications\InvoiceExpiredNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendInvoiceExpiredNotification implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(InvoiceExpired $event): void
    {
        $invoice = $event->invoice->loadMissing('owner');
        $owner = $invoice->owner;

        if ($owner === null) {
            return;
        }

        $owner->notify(new InvoiceExpiredNotification($invoice));

        $this->whatsapp->send(
            $owner,
            'Tagihan '.$invoice->number.' sudah kedaluwarsa karena melewati jatuh tempo.'
        );
    }
}

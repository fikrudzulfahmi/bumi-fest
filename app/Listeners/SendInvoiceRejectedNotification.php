<?php

namespace App\Listeners;

use App\Events\InvoiceRejected;
use App\Notifications\InvoiceRejectedNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendInvoiceRejectedNotification implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(InvoiceRejected $event): void
    {
        $invoice = $event->invoice->loadMissing('owner');
        $owner = $invoice->owner;

        if ($owner === null) {
            return;
        }

        $owner->notify(new InvoiceRejectedNotification($invoice, $event->reason));

        $this->whatsapp->send(
            $owner,
            'Bukti pembayaran '.$invoice->number.' ditolak: '.$event->reason
            .'. Silakan unggah ulang: '.route('invoices.show', $invoice->id)
        );
    }
}

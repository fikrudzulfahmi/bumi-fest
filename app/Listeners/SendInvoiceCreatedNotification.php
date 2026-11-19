<?php

namespace App\Listeners;

use App\Events\InvoiceCreated;
use App\Notifications\InvoiceCreatedNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * AC-F08-02: kirim email + WA tagihan baru ke pemilik tagihan.
 */
class SendInvoiceCreatedNotification implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(InvoiceCreated $event): void
    {
        $invoice = $event->invoice->loadMissing('owner');
        $owner = $invoice->owner;

        if ($owner === null) {
            return;
        }

        $owner->notify(new InvoiceCreatedNotification($invoice));

        $this->whatsapp->send(
            $owner,
            'Tagihan '.$invoice->number.' sebesar Rp'.number_format($invoice->total, 0, ',', '.')
            .($invoice->due_at !== null ? ' jatuh tempo '.$invoice->due_at->format('d/m/Y H:i').' WIB' : '')
            .'. Rincian: '.route('invoices.show', $invoice->id)
        );
    }
}

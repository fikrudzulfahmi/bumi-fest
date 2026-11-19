<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class InvoiceExpiredNotification extends Notification implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly Invoice $invoice,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Tagihan '.$this->invoice->number.' sudah kedaluwarsa')
            ->markdown('mail.invoice-expired', [
                'invoice' => $this->invoice,
                'url' => route('invoices.show', $this->invoice->id),
            ]);
    }
}

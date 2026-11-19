<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

/**
 * AC-F08-02: email tagihan memuat total, rekening, jatuh tempo, dan tautan.
 */
class InvoiceCreatedNotification extends Notification implements ShouldQueue
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
            ->subject('Tagihan Pendaftaran '.$this->invoice->number)
            ->markdown('mail.invoice-created', [
                'invoice' => $this->invoice,
                'url' => route('invoices.show', $this->invoice->id),
            ]);
    }
}

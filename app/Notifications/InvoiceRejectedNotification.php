<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

/**
 * AC-F08-03: email penolakan memuat alasan dan tautan unggah ulang.
 */
class InvoiceRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly Invoice $invoice,
        public readonly string $reason,
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
            ->subject('Bukti pembayaran '.$this->invoice->number.' perlu diperbaiki')
            ->markdown('mail.invoice-rejected', [
                'invoice' => $this->invoice,
                'reason' => $this->reason,
                'url' => route('invoices.show', $this->invoice->id),
            ]);
    }
}

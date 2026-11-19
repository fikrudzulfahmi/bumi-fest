<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

/**
 * AC-F08-04: pemberitahuan bukti baru hanya untuk admin.
 */
class ProofUploadedNotification extends Notification implements ShouldQueue
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
            ->subject('Bukti pembayaran baru: '.$this->invoice->number)
            ->markdown('mail.proof-uploaded', [
                'invoice' => $this->invoice,
                'url' => route('admin.payments.index'),
            ]);
    }
}

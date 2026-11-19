<?php

namespace App\Jobs;

use App\Services\Whatsapp\PhoneNumber;
use App\Services\Whatsapp\WhatsappGateway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Pengiriman WhatsApp terpisah dari proses bisnis (AC-F08-06):
 * gagal kirim → dicoba ulang 3× lalu tercatat di failed_jobs.
 */
class SendWhatsappMessage implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 60, 300];

    public function __construct(
        public readonly string $to,
        public readonly string $message,
    ) {}

    public function handle(WhatsappGateway $gateway): void
    {
        $normalized = PhoneNumber::normalize($this->to);

        if ($normalized === null) {
            return;
        }

        $gateway->send($normalized, $this->message);
    }

    public function failed(?Throwable $exception): void
    {
        report($exception);
    }
}

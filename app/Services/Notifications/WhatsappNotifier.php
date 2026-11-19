<?php

namespace App\Services\Notifications;

use App\Models\User;
use App\Services\Whatsapp\PhoneNumber;
use App\Services\Whatsapp\WhatsappGateway;
use Throwable;

/**
 * Pembungkus pengiriman WhatsApp: kegagalan gateway TIDAK boleh
 * menggagalkan proses bisnis (AC-F08-06).
 */
class WhatsappNotifier
{
    public function __construct(
        private readonly WhatsappGateway $gateway,
    ) {}

    public function send(?User $user, string $message): void
    {
        $number = PhoneNumber::normalize($user?->whatsapp);

        if ($number === null) {
            return;
        }

        try {
            $this->gateway->send($number, $message);
        } catch (Throwable $e) {
            report($e);
        }
    }
}

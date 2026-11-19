<?php

namespace App\Services\Whatsapp;

use Illuminate\Support\Facades\Log;

/**
 * Driver pengembangan: pesan WA ditulis ke log, tidak dikirim sungguhan.
 */
class LogWhatsappGateway implements WhatsappGateway
{
    public function send(string $to, string $message): void
    {
        Log::info('WhatsApp ke '.$to.': '.$message);
    }
}

<?php

namespace App\Services\Whatsapp;

interface WhatsappGateway
{
    /**
     * Kirim pesan WhatsApp. Nomor tujuan sudah dinormalisasi (62…).
     */
    public function send(string $to, string $message): void;
}

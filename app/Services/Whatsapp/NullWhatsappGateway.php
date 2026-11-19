<?php

namespace App\Services\Whatsapp;

class NullWhatsappGateway implements WhatsappGateway
{
    public function send(string $to, string $message): void
    {
        // Driver null: tidak melakukan apa pun (AC-F08-05).
    }
}

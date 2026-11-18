<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case Draft = 'draft';
    case AwaitingPayment = 'awaiting_payment';
    case AwaitingVerification = 'awaiting_verification';
    case Verified = 'verified';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::AwaitingPayment => 'Menunggu Pembayaran',
            self::AwaitingVerification => 'Menunggu Verifikasi',
            self::Verified => 'Terverifikasi',
            self::Rejected => 'Ditolak',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::AwaitingPayment => 'yellow',
            self::AwaitingVerification => 'blue',
            self::Verified => 'green',
            self::Rejected => 'red',
            self::Cancelled => 'slate',
        };
    }
}

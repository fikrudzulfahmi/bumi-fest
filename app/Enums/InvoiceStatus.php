<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Unpaid = 'unpaid';
    case AwaitingVerification = 'awaiting_verification';
    case Rejected = 'rejected';
    case Paid = 'paid';
    case Expired = 'expired';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Belum Dibayar',
            self::AwaitingVerification => 'Menunggu Verifikasi',
            self::Rejected => 'Ditolak',
            self::Paid => 'Terbayar',
            self::Expired => 'Kadaluarsa',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Unpaid => 'red',
            self::AwaitingVerification => 'blue',
            self::Rejected => 'orange',
            self::Paid => 'green',
            self::Expired => 'gray',
            self::Cancelled => 'slate',
        };
    }
}

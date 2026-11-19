<?php

namespace App\Services\Whatsapp;

class PhoneNumber
{
    /**
     * Normalisasi nomor Indonesia ke format 62… (AC-F08-05).
     * 0812… → 62812…, +62 812… → 62812…, 812… → 62812…
     */
    public static function normalize(?string $number): ?string
    {
        if ($number === null) {
            return null;
        }

        $digits = preg_replace('/[^0-9]/', '', $number);

        if ($digits === null || $digits === '') {
            return null;
        }

        if (str_starts_with($digits, '62')) {
            return $digits;
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return $digits;
    }
}

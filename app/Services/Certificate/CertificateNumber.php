<?php

namespace App\Services\Certificate;

use App\Exceptions\BusinessRuleViolation;
use App\Models\Certificate;
use App\Models\Competition;

/**
 * BR-14: nomor sertifikat `BF{yy}-{LEVEL}-{KODELOMBA}-{urut 4 digit}`,
 * unik global. KODELOMBA diturunkan dari id lomba (zero-padded 3 digit) —
 * asumsi F12: lomba belum punya kolom `code`, id menjamin keunikan.
 */
class CertificateNumber
{
    private const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

    public function forCompetition(Competition $competition): string
    {
        $year = now('Asia/Jakarta')->format('y');
        $level = $competition->level === 'smp_mts' ? 'SMP' : 'SD';
        $competitionCode = str_pad((string) $competition->id, 3, '0', STR_PAD_LEFT);

        $prefix = "BF{$year}-{$level}-{$competitionCode}-";
        $sequence = Certificate::where('number', 'like', $prefix.'%')->count() + 1;

        for ($attempt = 0; $attempt < 100; $attempt++) {
            $number = $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);

            if (! Certificate::where('number', $number)->exists()) {
                return $number;
            }

            $sequence++;
        }

        throw new BusinessRuleViolation('Gagal membuat nomor sertifikat unik. Coba lagi.');
    }

    /**
     * BR-14: kode verifikasi 10 karakter tanpa karakter ambigu (0/O, 1/I/L).
     */
    public function verificationCode(): string
    {
        do {
            $code = '';

            for ($i = 0; $i < 10; $i++) {
                $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
        } while (Certificate::where('verification_code', $code)->exists());

        return $code;
    }

    public static function levelLabel(?string $level): string
    {
        return $level === 'smp_mts' ? 'SMP' : 'SD';
    }
}

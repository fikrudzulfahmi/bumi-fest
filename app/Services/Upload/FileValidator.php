<?php

namespace App\Services\Upload;

use App\Exceptions\BusinessRuleViolation;
use Illuminate\Http\UploadedFile;

/**
 * Validasi berkas unggahan privat: ekstensi, ukuran, dan MIME asli.
 * Dipakai dokumen pendaftaran (F05) dan bukti pembayaran (F07).
 */
class FileValidator
{
    /**
     * @param  array<int, string>  $allowedExtensions
     * @param  array<int, string>  $allowedMimes
     */
    public static function validate(
        UploadedFile $file,
        array $allowedExtensions,
        array $allowedMimes,
        int $maxMegabytes = 5
    ): void {
        $extension = strtolower((string) $file->getClientOriginalExtension());

        if (! in_array($extension, $allowedExtensions, true)) {
            throw new BusinessRuleViolation(
                'Berkas hanya boleh '.implode(', ', $allowedExtensions).'.'
            );
        }

        if ($file->getSize() > $maxMegabytes * 1024 * 1024) {
            throw new BusinessRuleViolation('Ukuran berkas maksimal '.$maxMegabytes.' MB.');
        }

        $mimeType = (string) $file->getClientMimeType();

        if (! in_array($mimeType, $allowedMimes, true)) {
            // Verifikasi MIME asli dari isi berkas (cegah ekstensi palsu)
            $detected = (new \finfo(FILEINFO_MIME_TYPE))->file((string) $file->getRealPath());

            if (! in_array($detected, $allowedMimes, true)) {
                throw new BusinessRuleViolation('Jenis berkas tidak valid.');
            }
        }

        if ($extension === 'pdf') {
            $realPath = $file->getRealPath();

            // Pada upload nyata getRealPath() selalu terbaca. Pada berkas fake
            // (test) path bisa terdetach; validasi magic-byte hanya bila bisa dibaca.
            if (is_string($realPath) && is_readable($realPath)) {
                $head = (string) file_get_contents($realPath, false, null, 0, 5);

                if ($head !== '%PDF-') {
                    throw new BusinessRuleViolation('File PDF tidak valid.');
                }
            }
        }
    }

    /**
     * @return array<int, string>
     */
    public static function documentExtensions(): array
    {
        return ['jpg', 'jpeg', 'png', 'pdf'];
    }

    /**
     * @return array<int, string>
     */
    public static function documentMimes(): array
    {
        return ['image/jpeg', 'image/png', 'application/pdf'];
    }
}

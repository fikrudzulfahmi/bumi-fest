<?php

namespace App\Services\Certificate;

use App\Enums\CertificateType;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;

/**
 * BR-14: merender PDF sertifikat dari template (gambar) + layout JSON.
 * Nama panjang: ukuran font menyusut sampai muat satu baris (batas minimum).
 * QR (endroid) memuat URL verifikasi. Font DejaVu Sans mendukung aksen.
 */
class CertificatePdfRenderer
{
    /**
     * @param  array<string, mixed>  $layout
     * @param  array{name: string, competition: string, placement: string, number: string, verification_code: string, type: CertificateType}  $data
     */
    public function render(string $imagePath, array $layout, array $data): string
    {
        $name = $data['name'];
        $nameFont = $this->autoFontSize($name, $this->intVal($layout['name']['size'] ?? 32));

        $placementLabel = $data['type'] === CertificateType::Winner
            ? $data['placement']
            : $data['competition'];

        $verificationUrl = $this->verificationUrl($data['verification_code']);

        $qr = Builder::create()
            ->data($verificationUrl)
            ->encoding(new Encoding('UTF-8'))
            ->errorCorrectionLevel(ErrorCorrectionLevel::High)
            ->size(300)
            ->margin(0)
            ->build();

        $html = view('certificates.pdf', [
            'image' => $imagePath,
            'layout' => $layout,
            'name' => $name,
            'nameFont' => $nameFont,
            'placementLabel' => $placementLabel,
            'number' => $data['number'],
            'qr' => $qr->getDataUri(),
            'paper' => $layout['paper'] ?? ['a4', 'landscape'],
        ])->render();

        $orientation = ($layout['paper'][1] ?? 'landscape') === 'landscape' ? 'landscape' : 'portrait';

        return Pdf::loadHTML($html)
            ->setPaper($layout['paper'][0] ?? 'a4', $orientation)
            ->output();
    }

    /**
     * Ukuran font menyesuaikan panjang nama agar muat satu baris.
     * Faktor rata-rata lebar karakter DejaVu ~0.55 × ukuran font; batas minimum 10pt.
     */
    public function autoFontSize(string $name, int $baseSize): int
    {
        $length = mb_strlen($name);
        $min = 10;

        if ($baseSize <= $min) {
            return $min;
        }

        // Nama singkat: font tetap ukuran dasar.
        if ($length <= 18) {
            return $baseSize;
        }

        // Perkiraan lebar teks (pt) vs 85% lebar halaman A4 landscape (~715pt).
        $estimatedWidth = $length * $baseSize * 0.55;
        $maxWidth = 715.0;

        if ($estimatedWidth <= $maxWidth) {
            return $baseSize;
        }

        $shrunk = (int) floor($baseSize * $maxWidth / $estimatedWidth);

        return max($min, $shrunk);
    }

    private function intVal(mixed $value): int
    {
        return (int) ($value ?? 0);
    }

    /**
     * AC-F12-09: URL yang ditanam di QR menunjuk ke halaman verifikasi.
     */
    public function verificationUrl(string $code): string
    {
        return route('certificates.verify', $code);
    }
}

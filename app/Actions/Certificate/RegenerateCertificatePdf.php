<?php

namespace App\Actions\Certificate;

use App\Models\Certificate;
use App\Services\Certificate\CertificatePdfRenderer;
use Illuminate\Support\Facades\Storage;

/**
 * BR-16 / AC-F12-10: setelah koreksi nama, render ulang PDF
 * dengan nomor yang sama.
 */
class RegenerateCertificatePdf
{
    public function __construct(private readonly CertificatePdfRenderer $renderer) {}

    public function handle(Certificate $certificate): Certificate
    {
        $registration = $certificate->registration()->firstOrFail();
        $competition = $registration->competition()->firstOrFail();
        $participant = $certificate->participant()->firstOrFail();

        $template = $competition->certificateTemplates()
            ->where('type', $certificate->type->value)
            ->first();

        if ($template === null) {
            return $certificate;
        }

        $isWinner = $certificate->type->value === 'winner';

        $pdf = $this->renderer->render(
            Storage::disk('local')->path($template->image_path),
            $template->layout,
            [
                'name' => $participant->name,
                'competition' => $competition->name,
                'placement' => $isWinner ? 'Juara '.($certificate->placement ?? '') : $competition->name,
                'number' => $certificate->number,
                'verification_code' => $certificate->verification_code,
                'type' => $certificate->type,
            ],
        );

        $path = 'certificates/'.$certificate->id.'/'.str_replace('.', '', $certificate->number).'.pdf';
        Storage::disk('local')->put($path, $pdf);

        $certificate->forceFill(['file_path' => $path])->save();

        return $certificate->refresh();
    }
}

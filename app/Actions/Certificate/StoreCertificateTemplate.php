<?php

namespace App\Actions\Certificate;

use App\Enums\CertificateType;
use App\Models\CertificateTemplate;
use App\Models\Competition;
use App\Services\Upload\FileValidator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * AC-F12-01: simpan/unggah template sertifikat (PNG/JPG ≤5MB) + layout JSON.
 * Satu template per (lomba, jenis); unggah ulang menimpa berkas lama.
 */
class StoreCertificateTemplate
{
    /**
     * @param  array<string, mixed>  $layout
     */
    public function handle(
        Competition $competition,
        CertificateType $type,
        UploadedFile $image,
        array $layout,
    ): CertificateTemplate {
        FileValidator::validate($image, ['jpg', 'jpeg', 'png'], ['image/jpeg', 'image/png'], 5);

        $template = CertificateTemplate::query()
            ->where('competition_id', $competition->id)
            ->where('type', $type->value)
            ->first();

        $path = 'certificate-templates/'.$competition->id.'/'.$type->value.'-'.uniqid().'.'.$image->getClientOriginalExtension();
        Storage::disk('local')->put($path, (string) file_get_contents((string) $image->getRealPath()));

        if ($template === null) {
            $template = CertificateTemplate::query()->create([
                'competition_id' => $competition->id,
                'type' => $type->value,
                'image_path' => $path,
                'layout' => $layout,
            ]);
        } else {
            Storage::disk('local')->delete($template->image_path);

            $template->update([
                'image_path' => $path,
                'layout' => $layout,
            ]);
        }

        return $template->fresh();
    }
}

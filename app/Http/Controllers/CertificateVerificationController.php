<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * AC-F12-08: verifikasi sertifikat publik. Menampilkan data minimal
 * (nama, lomba, jenis/juara, tanggal) — tanpa data pribadi lain.
 */
class CertificateVerificationController extends Controller
{
    public function show(string $code): InertiaResponse
    {
        $code = Str::upper(trim($code));

        $certificate = Certificate::query()
            ->where('verification_code', $code)
            ->with(['participant', 'registration.competition'])
            ->first();

        if ($certificate === null) {
            return Inertia::render('verification/NotFound');
        }

        return Inertia::render('verification/Show', [
            'name' => $certificate->participant->name,
            'competition' => $certificate->registration->competition->name,
            'type' => $certificate->type->value,
            'type_label' => $certificate->type->label(),
            'placement' => $certificate->placement,
            'number' => $certificate->number,
            'generated_at' => $certificate->generated_at?->format('d F Y'),
        ]);
    }
}

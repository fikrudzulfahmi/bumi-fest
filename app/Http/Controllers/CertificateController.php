<?php

namespace App\Http\Controllers;

use App\Actions\Certificate\BuildCertificateZip;
use App\Models\Certificate;
use App\Models\Institution;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * AC-F12-06/07: daftar + unduh sertifikat pemilik entri; lembaga unduh ZIP.
 */
class CertificateController extends Controller
{
    public function index(): InertiaResponse
    {
        $user = request()->user();

        $certificates = Certificate::query()
            ->whereHas('registration', fn ($q) => $q->where('owner_id', $user->id))
            ->with(['registration.competition', 'participant'])
            ->orderByDesc('generated_at')
            ->get();

        return Inertia::render('certificates/Index', [
            'certificates' => $certificates->map(fn (Certificate $c) => [
                'id' => $c->id,
                'number' => $c->number,
                'type' => $c->type->value,
                'type_label' => $c->type->label(),
                'placement' => $c->placement,
                'participant_name' => $c->participant->name,
                'competition_name' => $c->registration->competition->name,
                'generated_at' => $c->generated_at?->toIso8601String(),
            ])->values(),
            'can_zip' => $user->isInstitution() && $user->institution !== null,
        ]);
    }

    /**
     * AC-F12-06: unduh PDF milik sendiri; pengguna lain 403.
     */
    public function download(Certificate $certificate): StreamedResponse|RedirectResponse
    {
        Gate::authorize('download', $certificate);

        if ($certificate->file_path === null || ! Storage::disk('local')->exists($certificate->file_path)) {
            return redirect()->route('certificates.index')->with('error', 'Sertifikat belum tersedia untuk diunduh.');
        }

        return Storage::disk('local')->download(
            $certificate->file_path,
            'sertifikat-'.$certificate->number.'.pdf',
        );
    }

    /**
     * AC-F12-07: lembaga unduh semua sertifikat siswanya dalam ZIP.
     */
    public function downloadAll(BuildCertificateZip $action): StreamedResponse|RedirectResponse
    {
        $user = request()->user();

        /** @var Institution|null $institution */
        $institution = $user->institution;

        if ($institution === null) {
            return redirect()->route('certificates.index')->with('error', 'Akun lembaga tidak terhubung ke lembaga.');
        }

        $zipPath = $action->handle($institution);

        return Storage::disk('local')->download($zipPath, 'sertifikat-'.now('Asia/Jakarta')->format('Ymd').'.zip');
    }
}

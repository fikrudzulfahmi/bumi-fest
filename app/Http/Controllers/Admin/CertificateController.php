<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Certificate\RegenerateCertificatePdf;
use App\Actions\Certificate\StoreCertificateTemplate;
use App\Enums\CertificateType;
use App\Enums\Level;
use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Competition;
use App\Services\Certificate\CertificatePdfRenderer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * F12: kelola template sertifikat + pratinjau + regenerasi.
 */
class CertificateController extends Controller
{
    public function index(Competition $competition): InertiaResponse
    {
        $templates = CertificateTemplate::query()
            ->where('competition_id', $competition->id)
            ->get();

        return Inertia::render('admin/certificates/Index', [
            'competition' => [
                'id' => $competition->id,
                'name' => $competition->name,
                'level_label' => Level::tryFrom($competition->level)?->label(),
                'results_published_at' => $competition->results_published_at?->toIso8601String(),
            ],
            'templates' => $templates->map(fn (CertificateTemplate $t) => [
                'id' => $t->id,
                'type' => $t->type->value,
                'type_label' => $t->type->label(),
                'layout' => $t->layout,
                'image_url' => route('admin.certificates.image', $t->id),
            ])->values(),
            'types' => CertificateType::cases(),
            'certificates_count' => $competition->certificates()->count(),
        ]);
    }

    public function store(Request $request, Competition $competition, StoreCertificateTemplate $action): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:winner,participation'],
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            'layout' => ['required', 'array'],
        ]);

        $action->handle(
            $competition,
            CertificateType::from($validated['type']),
            $request->file('image'),
            $validated['layout'],
        );

        return back()->with('success', 'Template sertifikat disimpan.');
    }

    /**
     * AC-F12-01: pratinjau PDF contoh.
     */
    public function preview(Request $request, Competition $competition, CertificatePdfRenderer $renderer): Response
    {
        $type = CertificateType::from($request->query('type', 'participation'));

        $template = CertificateTemplate::query()
            ->where('competition_id', $competition->id)
            ->where('type', $type->value)
            ->firstOrFail();

        $isWinner = $type === CertificateType::Winner;

        $pdf = $renderer->render(
            Storage::disk('local')->path($template->image_path),
            $template->layout,
            [
                'name' => 'Nama Peserta Contoh',
                'competition' => $competition->name,
                'placement' => $isWinner ? 'Juara 1' : $competition->name,
                'number' => 'BF'.now()->format('y').'-SD-PRATINJAU-0001',
                'verification_code' => 'PRATINJAU1',
                'type' => $type,
            ],
        );

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="pratinjau-sertifikat.pdf"',
        ]);
    }

    public function image(CertificateTemplate $template): StreamedResponse
    {
        return Storage::disk('local')->response($template->image_path);
    }

    /**
     * AC-F12-10: regenerasi PDF setelah koreksi nama (nomor tetap).
     */
    public function regenerate(Certificate $certificate, RegenerateCertificatePdf $action): RedirectResponse
    {
        $action->handle($certificate);

        return back()->with('success', 'Sertifikat '.$certificate->number.' dibuat ulang dengan nomor yang sama.');
    }

    public function download(Certificate $certificate): StreamedResponse
    {
        abort_unless($certificate->file_path !== null && Storage::disk('local')->exists($certificate->file_path), 404);

        return Storage::disk('local')->response($certificate->file_path);
    }
}

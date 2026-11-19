<?php

namespace App\Http\Controllers;

use App\Actions\Payment\UploadPaymentProof;
use App\Enums\InvoiceStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceController extends Controller
{
    /**
     * AC-F07-01/02: daftar tagihan milik pengguna.
     */
    public function index(Request $request): Response
    {
        $invoices = Invoice::query()
            ->where('owner_id', $request->user()->id)
            ->withCount('registrations')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('invoices/Index', [
            'invoices' => InvoiceResource::collection($invoices)->resolve(),
        ]);
    }

    /**
     * AC-F07-01/02: detail tagihan — hanya pemilik atau admin.
     */
    public function show(Request $request, Invoice $invoice): Response
    {
        $this->authorize('view', $invoice);

        $invoice->load(['registrations.competition:id,name,level,slug']);

        return Inertia::render('invoices/Show', [
            'invoice' => (new InvoiceResource($invoice))->resolve(),
            'entries' => $invoice->registrations->map(fn (Registration $registration) => [
                'id' => $registration->id,
                'code' => $registration->code,
                'team_name' => $registration->team_name,
                'status' => $registration->status->value,
                'status_label' => $registration->status->label(),
                'fee' => $registration->fee,
                'competition_name' => $registration->competition?->name,
                'level' => $registration->competition?->level,
                'slug' => $registration->competition?->slug,
            ])->values(),
            'canManage' => $request->user()->can('verify', $invoice),
        ]);
    }

    /**
     * AC-F07-03/04: unggah bukti pembayaran.
     */
    public function uploadProof(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('view', $invoice);

        $request->validate([
            'proof' => ['required', 'file', 'max:5120'],
        ], [
            'proof.required' => 'Pilih berkas bukti pembayaran.',
            'proof.max' => 'Ukuran berkas maksimal 5 MB.',
        ]);

        $file = $request->file('proof');

        if ($file === null) {
            return back()->withErrors(['proof' => 'Pilih berkas bukti pembayaran.']);
        }

        try {
            (new UploadPaymentProof)->handle($invoice, $file);
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['proof' => $e->getMessage()]);
        }

        return back()->with('success', 'Bukti pembayaran terkirim. Menunggu verifikasi admin.');
    }

    /**
     * AC-F07-02/05: pratinjau bukti lewat rute berpolicy (bukan URL publik).
     */
    public function proof(Request $request, Invoice $invoice): StreamedResponse
    {
        $this->authorize('view', $invoice);

        $path = $invoice->proof_path;

        abort_if($path === null || ! Storage::disk('local')->exists($path), 404);

        return Storage::disk('local')->response($path, 'bukti-'.$invoice->number.'.'.pathinfo($path, PATHINFO_EXTENSION));
    }

    /**
     * Ringkasan status untuk dasbor: jumlah tagihan terbuka + total.
     *
     * @return array{open: int, total: int, awaiting: int}
     */
    public static function summaryFor(int $ownerId): array
    {
        $query = Invoice::query()->where('owner_id', $ownerId);

        return [
            'open' => (clone $query)->whereIn('status', [InvoiceStatus::Unpaid, InvoiceStatus::Rejected])->count(),
            'total' => (int) (clone $query)->whereIn('status', [InvoiceStatus::Unpaid, InvoiceStatus::Rejected])->sum('total'),
            'awaiting' => (clone $query)->where('status', InvoiceStatus::AwaitingVerification)->count(),
        ];
    }
}

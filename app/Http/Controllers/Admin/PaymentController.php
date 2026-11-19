<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Payment\ExtendInvoiceDueDate;
use App\Actions\Payment\RejectInvoice;
use App\Actions\Payment\VerifyInvoice;
use App\Enums\InvoiceStatus;
use App\Enums\Level;
use App\Exceptions\BusinessRuleViolation;
use App\Exports\AdminPaymentExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\InvoiceResource;
use App\Models\Competition;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PaymentController extends Controller
{
    /**
     * AC-F07-05: antrean verifikasi — tertua dulu, filter + cari.
     */
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();
        $level = $request->string('level')->toString();
        $competitionId = $request->integer('competition_id');
        $search = trim($request->string('q')->toString());

        $invoices = $this->filteredQuery($request)
            ->with(['owner:id,name,email'])
            ->withCount('registrations')
            ->orderBy('proof_uploaded_at')
            ->orderBy('id')
            ->get();

        return Inertia::render('admin/payments/Index', [
            'invoices' => InvoiceResource::collection($invoices)->resolve(),
            'filters' => [
                'status' => $status,
                'level' => $level,
                'competition_id' => $competitionId,
                'q' => $search,
            ],
            'levels' => array_map(fn (Level $l) => [
                'value' => $l->value,
                'label' => $l->label(),
            ], Level::cases()),
            'competitions' => Competition::orderBy('name')->get(['id', 'name']),
            'counts' => [
                'awaiting' => Invoice::where('status', InvoiceStatus::AwaitingVerification)->count(),
                'paid' => Invoice::where('status', InvoiceStatus::Paid)->count(),
                'rejected' => Invoice::where('status', InvoiceStatus::Rejected)->count(),
            ],
        ]);
    }

    /**
     * AC-F09-03: ekspor pembayaran mengikuti filter aktif.
     */
    public function export(Request $request): BinaryFileResponse
    {
        $query = $this->filteredQuery($request)->with('owner:id,name,email');

        return Excel::download(
            new AdminPaymentExport($query),
            'pembayaran-'.now('Asia/Jakarta')->format('Ymd-His').'.xlsx',
        );
    }

    /**
     * AC-F07-06: terima pembayaran.
     */
    public function verify(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('verify', $invoice);

        /** @var User $admin */
        $admin = $request->user();

        try {
            (new VerifyInvoice)->handle($admin, $invoice);
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['invoice' => $e->getMessage()]);
        }

        return back()->with('success', 'Pembayaran '.$invoice->number.' diterima.');
    }

    /**
     * AC-F07-07: tolak dengan alasan wajib.
     */
    public function reject(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('reject', $invoice);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:255'],
        ], [
            'reason.required' => 'Alasan penolakan wajib diisi.',
            'reason.min' => 'Alasan penolakan minimal 5 karakter.',
        ]);

        /** @var User $admin */
        $admin = $request->user();

        try {
            (new RejectInvoice)->handle($admin, $invoice, $validated['reason']);
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['invoice' => $e->getMessage()]);
        }

        return back()->with('success', 'Pembayaran '.$invoice->number.' ditolak.');
    }

    /**
     * AC-F07-11: perpanjang jatuh tempo.
     */
    public function extend(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorize('extend', $invoice);

        $validated = $request->validate([
            'hours' => ['required', 'integer', 'min:1', 'max:720'],
        ], [
            'hours.required' => 'Durasi perpanjangan wajib diisi.',
        ]);

        /** @var User $admin */
        $admin = $request->user();

        try {
            (new ExtendInvoiceDueDate)->handle($admin, $invoice, (int) $validated['hours']);
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['invoice' => $e->getMessage()]);
        }

        /** @var Carbon $dueAt */
        $dueAt = $invoice->fresh()->due_at ?? now('Asia/Jakarta');

        return back()->with('success', 'Jatuh tempo diperpanjang sampai '.$dueAt->format('d/m/Y H:i').' WIB.');
    }

    /**
     * Filter tunggal untuk daftar & ekspor (AC-F07-05, AC-F09-03).
     *
     * @return Builder<Invoice>
     */
    private function filteredQuery(Request $request): Builder
    {
        $status = $request->string('status')->toString();
        $level = $request->string('level')->toString();
        $competitionId = $request->integer('competition_id');
        $search = trim($request->string('q')->toString());

        return Invoice::query()
            ->when(
                $status !== '' && in_array($status, array_column(InvoiceStatus::cases(), 'value'), true),
                fn ($query) => $query->where('status', $status),
                fn ($query) => $query->where('status', InvoiceStatus::AwaitingVerification)
            )
            ->when($level !== '', fn ($query) => $query->whereHas(
                'registrations.competition',
                fn ($q) => $q->where('level', $level)
            ))
            ->when($competitionId > 0, fn ($query) => $query->whereHas(
                'registrations',
                fn ($q) => $q->where('registrations.competition_id', $competitionId)
            ))
            ->when($search !== '', function ($query) use ($search) {
                $digits = (int) preg_replace('/\D/', '', $search);

                $query->where(function ($q) use ($search, $digits) {
                    $q->where('number', 'like', '%'.$search.'%')
                        ->orWhereHas('owner', fn ($o) => $o->where('name', 'like', '%'.$search.'%'));

                    if ($digits > 0) {
                        $q->orWhere('total', $digits);
                    }
                });
            });
    }
}

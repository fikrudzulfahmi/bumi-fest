<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Registration\AdminCancelRegistration;
use App\Actions\Registration\CorrectParticipantName;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Exports\AdminRegistrationExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminRegistrationResource;
use App\Jobs\ExportRegistrationsJob;
use App\Models\Competition;
use App\Models\Institution;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\User;
use App\Queries\RegistrationQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * AC-F09-02: filter gabungan + pencarian, paginasi 15, eager loading tanpa N+1.
 */
class RegistrationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $this->filteredQuery($request)
            ->with([
                'competition:id,name,level',
                'owner:id,name,email,whatsapp',
                'invoice:id,number,status,total,due_at',
            ])
            ->withCount('members');

        $registrations = $query
            ->orderByDesc('registrations.created_at')
            ->orderByDesc('registrations.id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/registrations/Index', [
            // Paginator apa adanya (data/links/total) — frontend butuh links.map & total.
            'registrations' => $registrations->through(
                fn (Registration $registration) => (new AdminRegistrationResource($registration))->resolve(),
            ),
            'filters' => $this->filters($request),
            'levels' => array_map(fn (Level $l) => [
                'value' => $l->value,
                'label' => $l->label(),
            ], Level::cases()),
            'statuses' => array_map(fn (RegistrationStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ], RegistrationStatus::cases()),
            'competitions' => Competition::query()->orderBy('name')->get(['id', 'name']),
            'institutions' => Institution::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function show(Registration $registration): Response
    {
        $registration->load([
            'competition:id,name,level,fee',
            'owner:id,name,email,whatsapp',
            'invoice',
            'members.participant',
            'documents',
        ]);

        return Inertia::render('admin/registrations/Show', [
            'registration' => (new AdminRegistrationResource($registration))->resolve(),
        ]);
    }

    /**
     * AC-F09-04: batalkan entri `verified` — alasan wajib, slot dilepas.
     */
    public function cancel(Request $request, Registration $registration): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:255'],
        ], [
            'reason.required' => 'Alasan pembatalan wajib diisi.',
            'reason.min' => 'Alasan pembatalan minimal 5 karakter.',
        ]);

        /** @var User $admin */
        $admin = $request->user();

        try {
            (new AdminCancelRegistration)->handle($admin, $registration, $validated['reason']);
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['reason' => $e->getMessage()]);
        }

        return back()->with('success', 'Entri '.$registration->code.' dibatalkan. Slot dilepas.');
    }

    /**
     * BR-16: koreksi nama siswa oleh admin.
     */
    public function correctName(Request $request, Participant $participant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:100'],
        ], [
            'name.required' => 'Nama siswa wajib diisi.',
            'name.min' => 'Nama siswa minimal 3 karakter.',
        ]);

        /** @var User $admin */
        $admin = $request->user();

        try {
            app(CorrectParticipantName::class)->handle($admin, $participant, $validated['name']);
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['name' => $e->getMessage()]);
        }

        return back()->with('success', 'Nama siswa diperbarui menjadi '.$validated['name'].'.');
    }

    /**
     * AC-F09-03: ekspor Excel mengikuti filter aktif.
     */
    public function export(Request $request): BinaryFileResponse|RedirectResponse
    {
        $filename = 'pendaftaran-'.now('Asia/Jakarta')->format('Ymd-His').'.xlsx';
        $query = $this->filteredQuery($request);

        // AC-F09-03: di atas ambang, ekspor diantrekan agar request tidak menggantung.
        if ($query->count() > (int) config('bumifest.export_queue_threshold')) {
            ExportRegistrationsJob::dispatch($this->filters($request), $filename);

            return back()->with('success', 'Ekspor sedang diproses. Berkas akan tersedia setelah antrean selesai.');
        }

        return Excel::download(new AdminRegistrationExport($query), $filename);
    }

    /**
     * @return Builder<Registration>
     */
    private function filteredQuery(Request $request): Builder
    {
        return RegistrationQuery::apply($this->filters($request));
    }

    /**
     * @return array<string, mixed>
     */
    private function filters(Request $request): array
    {
        return RegistrationQuery::normalize([
            'level' => $request->string('level')->toString(),
            'status' => $request->string('status')->toString(),
            'competition_id' => $request->integer('competition_id'),
            'institution_id' => $request->integer('institution_id'),
            'q' => $request->string('q')->toString(),
        ]);
    }
}

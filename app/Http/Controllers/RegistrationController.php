<?php

namespace App\Http\Controllers;

use App\Actions\Registration\CancelRegistration;
use App\Actions\Registration\SaveRegistrationDraft;
use App\Actions\Registration\SubmitRegistration;
use App\Actions\Registration\SwapRegistrationMember;
use App\Actions\Registration\UploadRegistrationDocument;
use App\Enums\DocumentType;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\RegistrationMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    /**
     * Form daftar di detail lomba: /portal/{level}/lomba/{slug}/daftar
     */
    public function create(string $level, Competition $competition): Response
    {
        abort_unless($competition->level === $level, 404);
        abort_unless($competition->status === 'published', 404);

        $draft = $this->ownDraft(auth()->id(), $competition->id);

        return Inertia::render('registrations/Create', [
            'competition' => [
                'id' => $competition->id,
                'slug' => $competition->slug,
                'name' => $competition->name,
                'category' => $competition->category,
                'team_min' => $competition->team_min,
                'team_max' => $competition->team_max,
                'fee' => $competition->fee,
                'quota' => $competition->quota,
                'required_documents' => $competition->required_documents ?? [],
                'submission_mode' => $competition->submission_mode,
            ],
            'participants' => Participant::forOwner(auth()->id())
                ->forLevel($competition->level)
                ->orderBy('name')
                ->get(['id', 'name', 'grade', 'school_name']),
            'draft' => $draft === null ? [] : [
                'team_name' => $draft->team_name,
                'participant_ids' => RegistrationMember::where('registration_id', $draft->id)
                    ->pluck('participant_id'),
            ],
            'level' => $level,
        ]);
    }

    public function store(string $level, Competition $competition, Request $request): RedirectResponse
    {
        abort_unless($competition->level === $level, 404);
        $this->validateRegistrationPayload($request, $competition);

        $registration = DB::transaction(function () use ($request, $competition) {
            $draft = $this->ownDraft(auth()->id(), $competition->id);

            if ($draft === null) {
                $draft = Registration::create([
                    'code' => 'BF'.now()->format('y').'-'.($competition->level === 'sd_mi' ? 'SD' : 'SMP').'-PENDING',
                    'competition_id' => $competition->id,
                    'owner_id' => auth()->id(),
                    'status' => RegistrationStatus::Draft,
                    'fee' => 0,
                ]);
            }

            // AC-F05-09: centang persetujuan disimpan di draf
            if (array_key_exists('consent', $request->only(['consent'])) && $request->boolean('consent')) {
                $draft->forceFill([
                    'requirements_accepted_at' => now('Asia/Jakarta'),
                    'consented_at' => now('Asia/Jakarta'),
                ]);
            }

            return app(SaveRegistrationDraft::class)->handle(
                $request->user(),
                $competition,
                $draft,
                $request->only(['team_name', 'participant_ids', 'submission_url', 'submission_name'])
            );
        });

        return redirect()
            ->route('registrations.edit', ['registration' => $registration->id])
            ->with('success', 'Draf pendaftaran disimpan.');
    }

    public function edit(Registration $registration): Response
    {
        $this->authorizeEdit($registration);

        $competition = $registration->competition;

        $memberPivot = RegistrationMember::where('registration_id', $registration->id)
            ->pluck('participant_id');

        $memberRows = Participant::whereIn('id', $memberPivot)->get();
        $docsByParticipant = RegistrationDocument::where('registration_id', $registration->id)
            ->get()
            ->groupBy('participant_id');

        $members = $memberRows->map(function (Participant $p) use ($docsByParticipant) {
            $docs = $docsByParticipant->get($p->id, collect());

            return [
                'id' => $p->id,
                'name' => $p->name,
                'grade' => $p->grade,
                'school_name' => $p->school_name,
                'uploaded_documents' => $docs->pluck('type')->map(fn ($t) => $t->value ?? $t)->all(),
            ];
        })->values();

        return Inertia::render('registrations/Edit', [
            'registration' => [
                'id' => $registration->id,
                'code' => $registration->code,
                'status' => $registration->status->value,
                'team_name' => $registration->team_name,
                'submission_url' => $registration->submission_url,
                'submission_name' => $registration->submission_name,
                'requirements_accepted_at' => $registration->requirements_accepted_at?->toIso8601String(),
                'consented_at' => $registration->consented_at?->toIso8601String(),
            ],
            'competition' => [
                'id' => $competition->id,
                'slug' => $competition->slug,
                'name' => $competition->name,
                'category' => $competition->category,
                'team_min' => $competition->team_min,
                'team_max' => $competition->team_max,
                'required_documents' => $competition->required_documents ?? [],
                'submission_mode' => $competition->submission_mode,
            ],
            'participants' => Participant::forOwner(auth()->id())
                ->forLevel($competition->level)
                ->orderBy('name')
                ->get(['id', 'name', 'grade', 'school_name']),
            'members' => $members,
            'level' => $competition->level,
        ]);
    }

    public function submit(string $level, Competition $competition, Registration $registration): RedirectResponse
    {
        abort_unless($competition->level === $level, 404);
        $this->authorizeEdit($registration);

        $registration = app(SubmitRegistration::class)->handle(auth()->user(), $registration);

        return redirect()
            ->route('registrations.index')
            ->with('success', 'Pendaftaran dikirim. Status: menunggu pembayaran.');
    }

    /**
     * /pendaftaran — daftar entri milik pengguna
     */
    public function index(): Response
    {
        $registrations = Registration::where('owner_id', auth()->id())
            ->with('competition:id,name,slug,level,category')
            ->latest()
            ->get()
            ->map(fn (Registration $r) => [
                'id' => $r->id,
                'code' => $r->code,
                'status' => $r->status->value,
                'status_label' => $r->status->label(),
                'fee' => $r->fee,
                'team_name' => $r->team_name,
                'competition_name' => $r->competition->name,
                'level' => $r->competition->level,
                'level_label' => Level::tryFrom((string) $r->competition->level)?->label() ?? $r->competition->level,
                'slug' => $r->competition->slug,
            ]);

        return Inertia::render('registrations/Index', [
            'registrations' => $registrations,
        ]);
    }

    public function cancel(Registration $registration): RedirectResponse
    {
        $this->authorizeEdit($registration);

        app(CancelRegistration::class)->handle(auth()->user(), $registration);

        return redirect()->route('registrations.index')
            ->with('success', 'Pendaftaran dibatalkan.');
    }

    /**
     * AC-F05-07/08: unggah dokumen wajib per anggota.
     */
    public function uploadDocument(Registration $registration, Request $request): RedirectResponse
    {
        $this->authorizeEdit($registration);

        $request->validate([
            'participant_id' => ['required', 'integer', 'exists:participants,id'],
            'document_type' => ['required', 'string', 'max:32'],
            'file' => ['required', 'file', 'max:5120'],
        ], [
            'participant_id.exists' => 'Siswa tidak ditemukan.',
            'file.max' => 'Ukuran berkas maksimal 5 MB.',
        ]);

        $type = $request->input('document_type');
        $allowed = array_map(fn (DocumentType $d) => $d->value, DocumentType::cases());

        if (! in_array($type, $allowed, true)) {
            return back()->withErrors(['document_type' => 'Jenis dokumen tidak valid.']);
        }

        try {
            app(UploadRegistrationDocument::class)->handle(
                $registration,
                $registration->competition,
                (int) $request->input('participant_id'),
                $type,
                $request->file('file')
            );
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['file' => $e->getMessage()]);
        }

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }

    /**
     * BR-08 / AC-F05-14: ganti anggota (swap) — tetap bisa meski entri
     * awaiting_verification; ditolak bila verified (nilai terkunci).
     */
    public function swapMember(Registration $registration, Request $request): RedirectResponse
    {
        $this->authorizeSwap($registration);

        $request->validate([
            'out_participant_id' => ['required', 'integer', 'exists:participants,id'],
            'in_participant_id' => ['required', 'integer', 'exists:participants,id'],
        ]);

        try {
            app(SwapRegistrationMember::class)->handle(
                $registration,
                (int) $request->input('out_participant_id'),
                (int) $request->input('in_participant_id')
            );
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['in_participant_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Anggota berhasil diganti.');
    }

    private function ownDraft(int $ownerId, int $competitionId): ?Registration
    {
        return Registration::where('owner_id', $ownerId)
            ->where('competition_id', $competitionId)
            ->where('status', RegistrationStatus::Draft->value)
            ->first();
    }

    private function authorizeEdit(Registration $registration): void
    {
        abort_unless($registration->owner_id === auth()->id(), 403);

        // AC-F05-14: awaiting_verification/verified tidak bisa diedit
        $locked = [RegistrationStatus::AwaitingVerification, RegistrationStatus::Verified];

        if (in_array($registration->status, $locked, true)) {
            abort(403, 'Entri telah terkunci setelah verifikasi dibuka.');
        }
    }

    private function authorizeSwap(Registration $registration): void
    {
        abort_unless($registration->owner_id === auth()->id(), 403);
    }

    private function validateRegistrationPayload(Request $request, Competition $competition): void
    {
        $category = $competition->category;
        $min = $competition->team_min ?? 1;
        $max = $competition->team_max ?? ($category === 'team' ? 99 : 1);

        // AC-F05-07/09: draf boleh disimpan tanpa dokumen/persetujuan;
        // persetujuan divalidasi saat KIRIM (SubmitRegistration)
        $request->validate([
            'participant_ids' => ['required', 'array', $category === 'team' ? "between:$min,$max" : 'size:1'],
            'participant_ids.*' => ['integer', 'exists:participants,id'],
            'team_name' => [$category === 'team' ? 'required' : 'prohibited', 'string', 'max:100'],
            'submission_url' => ['nullable', 'url', 'max:255'],
            'submission_name' => ['nullable', 'string', 'max:150'],
            'consent' => ['nullable', 'boolean'],
        ], [
            'participant_ids.between' => 'Jumlah anggota tim harus '.$min.'–'.$max.' siswa.',
            'participant_ids.size' => 'Lomba individu hanya untuk 1 siswa.',
            'team_name.required' => 'Nama tim wajib diisi.',
        ]);
    }
}

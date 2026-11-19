<?php

namespace App\Http\Controllers;

use App\Actions\Registration\CancelRegistration;
use App\Actions\Registration\SaveRegistrationDraft;
use App\Actions\Registration\SubmitRegistration;
use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
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

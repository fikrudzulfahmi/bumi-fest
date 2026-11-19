<?php

namespace App\Http\Controllers;

use App\Http\Requests\ParticipantRequest;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ParticipantController extends Controller
{
    public function index(): Response
    {
        $activeRegistrationIds = Registration::whereIn('status', Registration::slotHoldingStatuses())
            ->where('owner_id', auth()->id())
            ->pluck('id')
            ->all();

        $activeParticipantIds = RegistrationMember::whereIn('registration_id', $activeRegistrationIds)
            ->pluck('participant_id')
            ->all();

        $participants = Participant::forOwner(auth()->id())
            ->orderBy('name')
            ->get()
            ->map(fn (Participant $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'grade' => $p->grade,
                'level' => $p->level,
                'school_name' => $p->school_name,
                'school_city' => $p->school_city,
                'has_active_registration' => in_array($p->id, $activeParticipantIds, true),
            ]);

        return Inertia::render('participants/Index', [
            'participants' => $participants,
        ]);
    }

    public function store(ParticipantRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['level'] = Participant::levelForGrade((int) $data['grade'])->value;

        $participant = DB::transaction(function () use ($request, $data) {
            return Participant::create($data + [
                'owner_id' => $request->user()->id,
            ]);
        });

        return redirect()->route('participants.index')
            ->with('success', 'Siswa berhasil ditambahkan.');
    }

    public function update(ParticipantRequest $request, Participant $participant): RedirectResponse
    {
        $this->authorize('update', $participant);

        $data = $request->validated();
        $data['level'] = Participant::levelForGrade((int) $data['grade'])->value;

        $participant->update($data);

        return redirect()->route('participants.index')
            ->with('success', 'Siswa berhasil diperbarui.');
    }

    public function destroy(Participant $participant): RedirectResponse
    {
        $this->authorize('delete', $participant);

        // AC-F05-01: siswa dengan entri aktif tidak bisa dihapus
        $hasActive = Registration::whereIn('status', Registration::slotHoldingStatuses())
            ->whereHas('members', fn ($q) => $q->where('participant_id', $participant->id))
            ->exists();

        if ($hasActive) {
            throw ValidationException::withMessages([
                'participant' => 'Siswa memiliki pendaftaran aktif. Batalkan terlebih dahulu.',
            ]);
        }

        DB::transaction(fn () => $participant->delete());

        return redirect()->route('participants.index')
            ->with('success', 'Siswa berhasil dihapus.');
    }
}

<?php

namespace App\Actions\Registration;

use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use Illuminate\Support\Facades\DB;

class SwapRegistrationMember
{
    /**
     * BR-08: ganti anggota (swap) boleh sebelum closes_at & sebelum nilai
     * terkunci, tanpa mengubah biaya. Entri yang sudah awaiting_verification
     * / verified tidak bisa di-swap.
     */
    public function handle(Registration $registration, int $outParticipantId, int $inParticipantId): Registration
    {
        return DB::transaction(function () use ($registration, $outParticipantId, $inParticipantId) {
            $competition = $registration->competition;
            $now = now('Asia/Jakarta');

            if ($now->gt($competition->closes_at)) {
                throw new BusinessRuleViolation('Jenis pendaftaran sudah ditutup. Ganti anggota tidak tersedia.');
            }

            $locked = [
                RegistrationStatus::Verified,
            ];

            if (in_array($registration->status, $locked, true)) {
                throw new BusinessRuleViolation('Nilai sudah terkunci. Ganti anggota tidak tersedia.');
            }

            // Yang keluar harus anggota
            $oldMember = RegistrationMember::where('registration_id', $registration->id)
                ->where('participant_id', $outParticipantId)
                ->first();

            if (! $oldMember) {
                throw new BusinessRuleViolation('Siswa bukan anggota pendaftaran ini.');
            }

            // Yang masuk harus milik pengguna, jenjang sama, tidak duplikat
            $participant = Participant::whereKey($inParticipantId)
                ->forOwner($registration->owner_id)
                ->first();

            if (! $participant) {
                throw new BusinessRuleViolation('Siswa tidak ditemukan.');
            }

            if ($participant->level !== $competition->level) {
                throw new BusinessRuleViolation('Jenjang siswa harus sama dengan jenjang lomba.');
            }

            $duplicate = RegistrationMember::where('competition_id', $competition->id)
                ->where('participant_id', $inParticipantId)
                ->count();

            if ($duplicate > 0) {
                throw new BusinessRuleViolation('Siswa sudah terdaftar di lomba ini.');
            }

            // Jumlah tetap (ganti, bukan tambah) → biaya tidak berubah
            $oldMember->update(['participant_id' => $inParticipantId]);

            return $registration->fresh();
        });
    }
}

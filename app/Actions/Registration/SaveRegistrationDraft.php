<?php

namespace App\Actions\Registration;

use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SaveRegistrationDraft
{
    /**
     * Simpan/perbarui draf pendaftaran. Draf tidak menahan slot (BR-03).
     *
     * @param  array<string, mixed>  $data  team_name?, participant_ids, submission_url?, submission_name?
     */
    public function handle(User $user, Competition $competition, Registration $registration, array $data): Registration
    {
        return DB::transaction(function () use ($user, $competition, $registration, $data) {
            // BR-01: jenjang siswa harus sama dengan jenjang lomba
            $participantIds = array_map('intval', $data['participant_ids'] ?? []);

            foreach ($participantIds as $participantId) {
                $participant = Participant::whereKey($participantId)
                    ->forOwner($user->id)
                    ->first();

                if (! $participant) {
                    throw new BusinessRuleViolation('Siswa tidak ditemukan.');
                }

                if ($participant->level !== $competition->level) {
                    throw new BusinessRuleViolation('Jenjang siswa harus sama dengan jenjang lomba.');
                }
            }

            // BR-05: jumlah anggota sesuai kategori
            $this->assertMemberCount($competition, count($participantIds), $data['team_name'] ?? null);

            // BR-04 / AC-F05-06: satu siswa = satu entri per lomba
            $existing = RegistrationMember::whereIn('participant_id', $participantIds)
                ->where('competition_id', $competition->id)
                ->where('registration_id', '!=', $registration->id)
                ->count();

            if ($existing > 0) {
                throw new BusinessRuleViolation(
                    'Siswa sudah terdaftar di lomba ini. Satu siswa hanya bisa satu entri per lomba.'
                );
            }

            $registration->forceFill([
                'team_name' => $data['team_name'] ?? null,
                'submission_url' => $data['submission_url'] ?? null,
                'submission_name' => $data['submission_name'] ?? null,
            ])->save();

            RegistrationMember::where('registration_id', $registration->id)->delete();

            foreach ($participantIds as $participantId) {
                RegistrationMember::create([
                    'registration_id' => $registration->id,
                    'participant_id' => $participantId,
                    'competition_id' => $competition->id,
                ]);
            }

            return $registration;
        });
    }

    private function assertMemberCount(Competition $competition, int $count, ?string $teamName): void
    {
        if ($competition->category === 'team') {
            if ($teamName === null || trim($teamName) === '') {
                throw new BusinessRuleViolation('Nama tim wajib diisi untuk lomba tim.');
            }

            $min = $competition->team_min ?? 2;
            $max = $competition->team_max ?? $min;

            if ($count < $min || $count > $max) {
                throw new BusinessRuleViolation(
                    'Jumlah anggota tim harus '.$min.'–'.$max.' siswa.'
                );
            }
        } else {
            if ($count !== 1) {
                throw new BusinessRuleViolation('Lomba individu hanya untuk 1 siswa.');
            }
        }
    }
}

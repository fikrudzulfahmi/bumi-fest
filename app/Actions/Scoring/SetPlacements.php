<?php

namespace App\Actions\Scoring;

use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Registration;
use Illuminate\Support\Facades\DB;

/**
 * AC-F11-08: admin menetapkan juara 1–3 (seri boleh berbagi peringkat).
 */
class SetPlacements
{
    /**
     * @param  array<int, int>  $placements  registration_id => placement
     */
    public function handle(Competition $competition, array $placements): void
    {
        if ($competition->results_published_at !== null) {
            throw new BusinessRuleViolation('Hasil sudah diterbitkan. Juara tidak bisa diubah.');
        }

        if ($placements === []) {
            throw new BusinessRuleViolation('Tidak ada juara yang dipilih.');
        }

        if (count($placements) > 3) {
            throw new BusinessRuleViolation('Juara hanya untuk peringkat 1 sampai 3.');
        }

        $validIds = Registration::query()
            ->where('competition_id', $competition->id)
            ->where('status', RegistrationStatus::Verified)
            ->pluck('id')
            ->all();

        foreach ($placements as $registrationId => $placement) {
            if ($placement < 1 || $placement > 3) {
                throw new BusinessRuleViolation('Peringkat juara harus 1, 2, atau 3.');
            }

            if (! in_array((int) $registrationId, $validIds, true)) {
                throw new BusinessRuleViolation('Entri juara bukan entri terverifikasi lomba ini.');
            }
        }

        DB::transaction(function () use ($competition, $placements): void {
            Registration::query()
                ->where('competition_id', $competition->id)
                ->update(['placement' => null]);

            foreach ($placements as $registrationId => $placement) {
                Registration::query()
                    ->where('id', $registrationId)
                    ->where('competition_id', $competition->id)
                    ->update(['placement' => $placement]);
            }
        });
    }
}

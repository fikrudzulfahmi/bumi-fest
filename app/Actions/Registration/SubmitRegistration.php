<?php

namespace App\Actions\Registration;

use App\Actions\Invoice\CreateInvoice;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\RegistrationMember;
use App\Models\User;
use App\Services\Settings\Settings;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SubmitRegistration
{
    /**
     * Kirim pendaftaran (draft/awaiting_payment/rejected → awaiting_payment).
     * Kunci baris lomba, cek BR-02..BR-06, snapshot fee, buat kode,
     * buat tagihan (AC-F05-10, 12).
     */
    public function handle(User $user, Registration $registration): Registration
    {
        return DB::transaction(function () use ($user, $registration) {
            /** @var Competition $competition */
            $competition = $registration->competition()->lockForUpdate()->first();

            $this->assertRegistrable($competition);
            $this->assertDocumentsComplete($registration);
            $this->assertConsented($registration);
            $this->assertNotDuplicateMember($competition, $registration, $user);
            $this->assertMaxCompetitions($user, $competition);

            // BR-03: kuota per entri dengan lockForUpdate (AC-F05-12)
            $slotHolding = Registration::forCompetition($competition->id)
                ->slotHolding()
                ->where('id', '!=', $registration->id)
                ->count();

            if ($competition->quota !== null && $slotHolding + 1 > $competition->quota) {
                throw new BusinessRuleViolation('Kuota lomba ini sudah penuh.');
            }

            // Snapshot fee (BR-06)
            $registration->forceFill([
                'fee' => $competition->fee,
                'status' => RegistrationStatus::AwaitingPayment,
                'submitted_at' => now('Asia/Jakarta'),
            ]);

            // Kode registrasi dibuat saat kirim (AC-F05-10)
            $registration->code = $this->generateCode($competition);

            $registration->save();

            app(CreateInvoice::class)->handle($registration);

            return $registration->fresh();
        });
    }

    /**
     * BR-02: hanya published + jendela waktu + slot tersedia.
     */
    private function assertRegistrable(Competition $competition): void
    {
        if ($competition->status !== 'published') {
            throw new BusinessRuleViolation('Lomba ini belum dibuka.');
        }

        $now = Carbon::now('Asia/Jakarta');

        if ($now->lt($competition->opens_at)) {
            throw new BusinessRuleViolation('Pendaftaran belum dibuka. Buka '.$competition->opens_at->locale('id')->isoFormat('DD MMMM YYYY HH:mm').' WIB.');
        }

        if ($now->gt($competition->closes_at)) {
            throw new BusinessRuleViolation('Pendaftaran sudah ditutup.');
        }
    }

    /**
     * AC-F05-07: dokumen wajib per anggota harus sudah terunggah.
     */
    private function assertDocumentsComplete(Registration $registration): void
    {
        $required = $registration->competition->required_documents ?? [];

        if (empty($required)) {
            return;
        }

        $memberIds = $registration->members()
            ->pluck('participant_id')
            ->all();

        if ($memberIds === []) {
            throw new BusinessRuleViolation('Pilih minimal satu siswa sebelum mengirim.');
        }

        $missing = collect($memberIds)
            ->filter(function (int $participantId) use ($registration, $required) {
                $uploaded = $registration->documents()
                    ->where('participant_id', $participantId)
                    ->pluck('type')
                    ->map(fn ($t) => $t->value ?? $t)
                    ->all();

                foreach ($required as $type) {
                    if (! in_array($type, $uploaded, true)) {
                        return true;
                    }
                }

                return false;
            });

        if ($missing->isNotEmpty()) {
            throw new BusinessRuleViolation('Dokumen wajib belum lengkap. Simpan draf dulu, unggah dokumen, lalu kirim.');
        }
    }

    /**
     * AC-F05-09: persetujuan persyaratan wajib dicentang.
     */
    private function assertConsented(Registration $registration): void
    {
        if ($registration->requirements_accepted_at === null) {
            throw new BusinessRuleViolation('Centang persetujuan persyaratan dan juknis terlebih dahulu.');
        }

        if ($registration->consented_at === null) {
            throw new BusinessRuleViolation('Centang persetujuan privasi terlebih dahulu.');
        }
    }

    /**
     * AC-F05-06: satu siswa hanya boleh satu entri aktif per lomba.
     */
    private function assertNotDuplicateMember(Competition $competition, Registration $registration, User $user): void
    {
        $memberIds = $registration->members()->pluck('participant_id')->all();

        if ($memberIds === []) {
            throw new BusinessRuleViolation('Pilih minimal satu siswa sebelum mengirim.');
        }

        $existing = RegistrationMember::query()
            ->whereIn('competition_id', [$competition->id])
            ->whereIn('participant_id', $memberIds)
            ->where('registration_id', '!=', $registration->id)
            ->whereHas('registration', function ($q) {
                $q->whereIn('status', Registration::slotHoldingStatuses())
                    ->orWhere('status', RegistrationStatus::Draft->value);
            })
            ->exists();

        if ($existing) {
            throw new BusinessRuleViolation('Siswa sudah terdaftar di lomba ini.');
        }
    }

    /**
     * AC-F05-06: batas lomba per siswa (settings).
     */
    private function assertMaxCompetitions(User $user, Competition $competition): void
    {
        $max = Settings::get('max_competitions_per_participant');

        if ($max === null) {
            return;
        }

        $count = Registration::forCompetition($competition->id)
            ->slotHolding()
            ->where('owner_id', $user->id)
            ->count();

        if ($count >= $max) {
            throw new BusinessRuleViolation(
                'Maksimal '.$max.' lomba per peserta sudah tercapai.'
            );
        }
    }

    /**
     * Kode registrasi unik: BF26-SD-00001 (per jenjang & tahun).
     */
    private function generateCode(Competition $competition): string
    {
        $levelCode = $competition->level === 'sd_mi' ? 'SD' : 'SMP';
        $year = now()->format('y');
        $prefix = "BF{$year}-{$levelCode}-";

        $sequence = Registration::where('code', 'like', $prefix.'%')->count() + 1;

        do {
            $code = $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
            $sequence++;
        } while (Registration::where('code', $code)->exists());

        return $code;
    }
}

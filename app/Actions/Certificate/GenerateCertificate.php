<?php

namespace App\Actions\Certificate;

use App\Enums\CertificateType;
use App\Enums\RegistrationStatus;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Participant;
use App\Models\Registration;
use App\Services\Certificate\CertificateNumber;
use App\Services\Certificate\CertificatePdfRenderer;
use Illuminate\Support\Facades\Storage;

/**
 * BR-14: buat sertifikat untuk satu anggota entri verified, idempoten
 * (firstOrCreate per registration+participant). Juara bila placement 1-3,
 * selain itu partisipasi. Nomor & kode verifikasi dibuat sekali saja.
 */
class GenerateCertificate
{
    public function __construct(
        private readonly CertificateNumber $number,
        private readonly CertificatePdfRenderer $renderer,
    ) {}

    public function handle(Registration $registration, Participant $participant): Certificate
    {
        if ($registration->status !== RegistrationStatus::Verified) {
            throw new BusinessRuleViolation('Hanya entri terverifikasi yang mendapat sertifikat.');
        }

        $existing = Certificate::query()
            ->where('registration_id', $registration->id)
            ->where('participant_id', $participant->id)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        $competition = $registration->competition()->firstOrFail();
        $isWinner = $registration->placement !== null && $registration->placement >= 1 && $registration->placement <= 3;
        $type = $isWinner ? CertificateType::Winner : CertificateType::Participation;

        $template = CertificateTemplate::query()
            ->where('competition_id', $competition->id)
            ->where('type', $type->value)
            ->first();

        if ($template === null) {
            throw new BusinessRuleViolation(
                'Template sertifikat '.($isWinner ? 'juara' : 'partisipasi').' belum tersedia untuk lomba ini.',
            );
        }

        $certificate = Certificate::query()->create([
            'registration_id' => $registration->id,
            'participant_id' => $participant->id,
            'type' => $type->value,
            'placement' => $isWinner ? $registration->placement : null,
            'number' => $this->number->forCompetition($competition),
            'verification_code' => $this->number->verificationCode(),
        ]);

        $pdf = $this->renderer->render(
            Storage::disk('local')->path($template->image_path),
            $template->layout,
            [
                'name' => $participant->name,
                'competition' => $competition->name,
                'placement' => $isWinner ? 'Juara '.$registration->placement : $competition->name,
                'number' => $certificate->number,
                'verification_code' => $certificate->verification_code,
                'type' => $type,
            ],
        );
        $path = 'certificates/'.$certificate->id.'/'.str_replace('.', '', $certificate->number).'.pdf';
        Storage::disk('local')->put($path, $pdf);

        $certificate->forceFill([
            'file_path' => $path,
            'generated_at' => now('Asia/Jakarta'),
        ])->save();

        activity()
            ->performedOn($certificate)
            ->withProperties(['type' => $type->value, 'number' => $certificate->number])
            ->log('Sertifikat dibuat');

        return $certificate->refresh();
    }
}

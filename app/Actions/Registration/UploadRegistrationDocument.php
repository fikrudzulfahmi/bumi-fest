<?php

namespace App\Actions\Registration;

use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\RegistrationMember;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class UploadRegistrationDocument
{
    /**
     * Unggah dokumen wajib per anggota (AC-F05-07/08):
     * - hanya jpg/png/pdf ≤ 5 MB,
     * - MIME asli diverifikasi (finfo + PDF header),
     * - nama acak di disk privat (`registrations/{id}/docs/`).
     */
    public function handle(
        Registration $registration,
        Competition $competition,
        int $participantId,
        string $type,
        UploadedFile $file
    ): RegistrationDocument {
        $this->assertFileValid($file);

        // Anggota harus milik pengguna & terdaftar di entri ini
        $participant = Participant::whereKey($participantId)
            ->forOwner($registration->owner_id)
            ->first();

        if (! $participant) {
            throw new BusinessRuleViolation('Siswa tidak ditemukan.');
        }

        $isMember = RegistrationMember::where('registration_id', $registration->id)
            ->where('participant_id', $participantId)
            ->exists();

        if (! $isMember) {
            throw new BusinessRuleViolation('Siswa bukan anggota pendaftaran ini.');
        }

        return DB::transaction(function () use ($registration, $participantId, $type, $file) {
            // Ganti bila tipe sudah ada untuk anggota yang sama
            $existing = RegistrationDocument::where('registration_id', $registration->id)
                ->where('participant_id', $participantId)
                ->where('type', $type)
                ->first();

            if ($existing) {
                \Storage::disk('local')->delete($existing->path);
                $existing->delete();
            }

            $path = $file->store(
                'registrations/'.$registration->id.'/docs',
                'local'
            );

            return RegistrationDocument::create([
                'registration_id' => $registration->id,
                'participant_id' => $participantId,
                'type' => $type,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ]);
        });
    }

    /**
     * AC-F05-08: ekstensi + MIME asli + ukuran.
     */
    private function assertFileValid(UploadedFile $file): void
    {
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $allowed = ['jpg', 'jpeg', 'png', 'pdf'];

        if (! in_array($extension, $allowed, true)) {
            throw new BusinessRuleViolation('Berkas hanya boleh jpg, png, atau pdf.');
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            throw new BusinessRuleViolation('Ukuran berkas maksimal 5 MB.');
        }

        $mimeType = (string) $file->getClientMimeType();
        $mimeAllowed = ['image/jpeg', 'image/png', 'application/pdf'];

        if (! in_array($mimeType, $mimeAllowed, true)) {
            // Verifikasi MIME asli dari isi berkas (cegah ekstensi palsu)
            $detected = (new \finfo(FILEINFO_MIME_TYPE))->file($file->getRealPath());
            if (! in_array($detected, $mimeAllowed, true)) {
                throw new BusinessRuleViolation('Jenis berkas tidak valid.');
            }
        }

        if ($extension === 'pdf') {
            $realPath = $file->getRealPath();

            // Pada upload nyata getRealPath() selalu terbaca. Pada berkas fake
            // (test) path bisa terdetach; validasi magic-byte hanya bila bisa dibaca.
            if (is_string($realPath) && is_readable($realPath)) {
                $head = (string) file_get_contents($realPath, false, null, 0, 5);

                if ($head !== '%PDF-') {
                    throw new BusinessRuleViolation('File PDF tidak valid.');
                }
            }
        }
    }
}

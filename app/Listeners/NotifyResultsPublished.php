<?php

namespace App\Listeners;

use App\Enums\RegistrationStatus;
use App\Events\ResultsPublished;
use App\Models\Registration;
use App\Notifications\ResultsPublishedNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * AC-F11-10: beri tahu pemilik entri terverifikasi bahwa hasil sudah terbit.
 */
class NotifyResultsPublished implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(ResultsPublished $event): void
    {
        $registrations = Registration::query()
            ->where('competition_id', $event->competition->id)
            ->where('status', RegistrationStatus::Verified)
            ->with('owner')
            ->get();

        foreach ($registrations as $registration) {
            $owner = $registration->owner;

            if ($owner === null) {
                continue;
            }

            $owner->notify(new ResultsPublishedNotification($registration));

            $this->whatsapp->send(
                $owner,
                'Hasil lomba '.$event->competition->name.' sudah dipublikasikan. Cek portal Bumifest untuk juara dan sertifikat.',
            );
        }
    }
}

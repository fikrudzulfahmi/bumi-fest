<?php

namespace App\Listeners;

use App\Enums\Role;
use App\Events\ProofUploaded;
use App\Models\User;
use App\Notifications\ProofUploadedNotification;
use App\Services\Notifications\WhatsappNotifier;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;

/**
 * AC-F08-04: bukti baru hanya diberitahukan ke admin, bukan juri/peserta.
 */
class NotifyAdminsProofUploaded implements ShouldQueue
{
    public int $tries = 3;

    public function __construct(
        private readonly WhatsappNotifier $whatsapp,
    ) {}

    public function handle(ProofUploaded $event): void
    {
        $invoice = $event->invoice->loadMissing('owner');

        /** @var Collection<int, User> $admins */
        $admins = User::query()
            ->where('role', Role::Admin->value)
            ->where('is_active', true)
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new ProofUploadedNotification($invoice));

            $this->whatsapp->send(
                $admin,
                'Bukti pembayaran baru untuk '.$invoice->number.' dari '
                .($invoice->owner->name ?? '-').'. Verifikasi: '.route('admin.payments.index')
            );
        }
    }
}

<?php

namespace App\Http\Resources;

use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\RegistrationMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Registration
 */
class AdminRegistrationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $invoice = $this->whenLoaded('invoice');

        return [
            'id' => $this->id,
            'code' => $this->code,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_color' => $this->status->color(),
            'team_name' => $this->team_name,
            'fee' => $this->fee,
            'placement' => $this->placement,
            'final_score' => $this->final_score,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'competition' => $this->whenLoaded('competition', fn () => [
                'id' => $this->competition->id,
                'name' => $this->competition->name,
                'level' => $this->competition->level,
            ]),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
                'whatsapp' => $this->owner->whatsapp,
            ]),
            'invoice' => $invoice ? [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'status' => $invoice->status->value,
                'status_label' => $invoice->status->label(),
                'total' => $invoice->total,
                'due_at' => $invoice->due_at?->toIso8601String(),
            ] : null,
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(
                fn (RegistrationDocument $doc) => [
                    'id' => $doc->id,
                    'type' => $doc->type->value,
                    'type_label' => $doc->type->label(),
                    'original_name' => $doc->original_name,
                    'size' => $doc->size,
                ]
            )->values()),
            'members' => $this->whenLoaded('members', fn () => $this->members->map(
                fn (RegistrationMember $member) => [
                    'id' => $member->id,
                    'position' => $member->position,
                    'participant' => $member->relationLoaded('participant') && $member->participant instanceof Participant
                        ? [
                            'id' => $member->participant->id,
                            'name' => $member->participant->name,
                            'grade' => $member->participant->grade,
                            'level' => $member->participant->level,
                            'school_name' => $member->participant->school_name,
                            'school_city' => $member->participant->school_city,
                        ]
                        : null,
                ]
            )->values()),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invoice
 */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'subtotal' => $this->subtotal,
            'unique_code' => $this->unique_code,
            'discount' => $this->discount,
            'total' => $this->total,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'status_color' => $this->status->color(),
            'bank_name' => $this->bank_name,
            'bank_account_number' => $this->bank_account_number,
            'bank_account_holder' => $this->bank_account_holder,
            'has_proof' => $this->proof_path !== null,
            'proof_uploaded_at' => $this->proof_uploaded_at?->toIso8601String(),
            'due_at' => $this->due_at?->toIso8601String(),
            'is_overdue' => $this->due_at !== null
                && $this->due_at->isPast()
                && in_array($this->status->value, ['unpaid', 'rejected'], true),
            'rejection_reason' => $this->rejection_reason,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'registrations_count' => $this->whenCounted('registrations'),
            'owner' => $this->whenLoaded('owner', fn (User $owner) => [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

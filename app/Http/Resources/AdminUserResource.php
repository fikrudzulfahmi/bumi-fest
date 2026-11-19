<?php

namespace App\Http\Resources;

use App\Enums\Level;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'whatsapp' => $this->whatsapp,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'is_active' => $this->is_active,
            'institution' => $this->whenLoaded('institution', fn () => $this->institution === null ? null : [
                'id' => $this->institution->id,
                'name' => $this->institution->name,
            ]),
            'registrations_count' => $this->whenCounted('registrations'),
            'assignments' => $this->whenLoaded('judgeAssignments', fn () => $this->judgeAssignments->map(fn ($assignment) => [
                'id' => $assignment->id,
                'competition' => [
                    'id' => $assignment->competition->id,
                    'name' => $assignment->competition->name,
                    'level' => $assignment->competition->level,
                    'level_label' => Level::tryFrom($assignment->competition->level)?->label(),
                ],
            ])->values()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

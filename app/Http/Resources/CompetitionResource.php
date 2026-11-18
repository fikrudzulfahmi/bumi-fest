<?php

namespace App\Http\Resources;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\Level;
use App\Enums\SubmissionMode;
use App\Models\Competition;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Competition
 */
class CompetitionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $level = Level::tryFrom($this->level);
        $category = CompetitionCategory::tryFrom($this->category);
        $status = CompetitionStatus::tryFrom($this->status);
        $submissionMode = SubmissionMode::tryFrom($this->submission_mode ?? '');

        return [
            'id' => $this->id,
            'level' => $this->level,
            'level_label' => $level?->label(),
            'level_slug' => $level?->slug(),
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category,
            'category_label' => $category?->label(),
            'fee' => $this->fee,
            'quota' => $this->quota,
            'team_min' => $this->team_min,
            'team_max' => $this->team_max,
            'opens_at' => $this->opens_at->toIso8601String(),
            'closes_at' => $this->closes_at->toIso8601String(),
            'status' => $this->status,
            'status_label' => $status?->label(),
            'rules_pdf_path' => $this->rules_pdf_path,
            'requirements' => $this->requirements ?? [],
            'required_documents' => $this->required_documents ?? [],
            'submission_mode' => $this->submission_mode,
            'submission_mode_label' => $submissionMode?->label(),
            'submission_mimes' => $this->submission_mimes ?? [],
            'submission_max_mb' => $this->submission_max_mb,
            'results_published_at' => $this->results_published_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}

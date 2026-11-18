<?php

namespace App\Actions\Competition;

use App\Models\Competition;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreCompetition
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): Competition
    {
        return DB::transaction(function () use ($data) {
            // Handle PDF upload
            $rulerPath = null;
            if (isset($data['rules_pdf_path']) && $data['rules_pdf_path']) {
                $rulerPath = $data['rules_pdf_path']->storeAs(
                    'competitions/rules',
                    Str::random(16).'.pdf',
                    'public'
                );
            }

            $payload = [
                'level' => $data['level'],
                'name' => $data['name'],
                'slug' => $data['slug'],
                'description' => $data['description'],
                'category' => $data['category'],
                'fee' => $data['fee'],
                'quota' => $data['quota'] ?? null,
                'team_min' => $data['team_min'] ?? null,
                'team_max' => $data['team_max'] ?? null,
                'opens_at' => $data['opens_at'],
                'closes_at' => $data['closes_at'],
                'status' => 'draft',
                'rules_pdf_path' => $rulerPath,
                'requirements' => $data['requirements'] ?? null,
                'required_documents' => $data['required_documents'] ?? null,
                'submission_mode' => $data['submission_mode'],
                'submission_mimes' => $data['submission_mimes'] ?? null,
                'submission_max_mb' => $data['submission_max_mb'] ?? null,
            ];

            return Competition::create($payload);
        });
    }
}

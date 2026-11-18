<?php

namespace App\Actions\Competition;

use App\Models\Competition;
use Illuminate\Support\Facades\DB;

class UpdateCompetition
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(Competition $competition, array $data): Competition
    {
        return DB::transaction(function () use ($competition, $data) {
            // Handle PDF upload
            if (isset($data['rules_pdf_path']) && $data['rules_pdf_path']) {
                // Delete old file if exists
                if ($competition->rules_pdf_path) {
                    \Storage::disk('public')->delete($competition->rules_pdf_path);
                }

                $rulerPath = $data['rules_pdf_path']->storeAs(
                    'competitions/rules',
                    \Str::random(16).'.pdf',
                    'public'
                );
                $data['rules_pdf_path'] = $rulerPath;
            } else {
                unset($data['rules_pdf_path']);
            }

            $competition->update($data);

            return $competition;
        });
    }
}

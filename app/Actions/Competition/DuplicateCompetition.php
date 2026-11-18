<?php

namespace App\Actions\Competition;

use App\Models\Competition;
use Illuminate\Support\Facades\DB;

class DuplicateCompetition
{
    public function handle(Competition $competition): Competition
    {
        return DB::transaction(function () use ($competition) {
            $copy = $competition->replicate();
            $copy->name = $competition->name.' (Salinan)';
            $copy->slug = $this->uniqueSlug($competition->slug);
            $copy->status = 'draft';
            $copy->results_published_at = null;
            $copy->save();

            return $copy;
        });
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base.'-salinan';
        $i = 2;

        while (Competition::where('slug', $slug)->exists()) {
            $slug = $base.'-salinan-'.$i;
            $i++;
        }

        return $slug;
    }
}

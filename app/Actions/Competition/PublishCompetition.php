<?php

namespace App\Actions\Competition;

use App\Models\Competition;
use Illuminate\Support\Facades\DB;

class PublishCompetition
{
    public function handle(Competition $competition): Competition
    {
        return DB::transaction(function () use ($competition) {
            $competition->update(['status' => 'published']);

            return $competition;
        });
    }
}

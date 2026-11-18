<?php

namespace App\Actions\Competition;

use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DeleteCompetition
{
    public function handle(Competition $competition): void
    {
        DB::transaction(function () use ($competition) {
            if ($this->hasRegistrations($competition)) {
                throw new BusinessRuleViolation('Lomba yang sudah memiliki pendaftaran tidak dapat dihapus. Arsipkan saja.');
            }

            if ($competition->rules_pdf_path) {
                \Storage::disk('public')->delete($competition->rules_pdf_path);
            }

            $competition->delete();
        });
    }

    private function hasRegistrations(Competition $competition): bool
    {
        if (! Schema::hasTable('registrations')) {
            return false;
        }

        return DB::table('registrations')
            ->where('competition_id', $competition->id)
            ->exists();
    }
}

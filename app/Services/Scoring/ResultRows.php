<?php

namespace App\Services\Scoring;

use App\Enums\RegistrationStatus;
use App\Enums\ScoreSheetStatus;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\RegistrationMember;
use App\Models\ScoreSheet;
use Illuminate\Support\Collection;

/**
 * Baris peringkat satu lomba (BR-12): terurut nilai akhir menurun,
 * seri ditandai, entri tanpa nilai lengkap tidak berperingkat.
 */
class ResultRows
{
    public function __construct(private readonly FinalScoreCalculator $calculator) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function forCompetition(Competition $competition): array
    {
        $criteria = $competition->rubricCriteria()->get();
        $assignedJudges = $competition->judgeAssignments()->count();

        $registrations = Registration::query()
            ->where('competition_id', $competition->id)
            ->where('status', RegistrationStatus::Verified)
            ->with(['members.participant', 'scoreSheets.scores'])
            ->orderBy('code')
            ->get();

        $rows = [];

        foreach ($registrations as $registration) {
            /** @var Collection<int, ScoreSheet> $locked */
            $locked = $registration->scoreSheets
                ->filter(fn (ScoreSheet $sheet) => $sheet->status === ScoreSheetStatus::Locked)
                ->values();

            $finalScore = $this->calculator->average($criteria, $locked, $assignedJudges);

            $names = $registration->members
                ->map(fn (RegistrationMember $member) => $member->participant?->name)
                ->filter()
                ->values()
                ->all();

            $school = $registration->members
                ->map(fn (RegistrationMember $member) => $member->participant?->school_name)
                ->filter()
                ->first();

            $rows[] = [
                'id' => $registration->id,
                'code' => $registration->code,
                'team_name' => $registration->team_name,
                'names' => $names,
                'school_name' => $school,
                'sheets_locked' => $locked->count(),
                'sheets_total' => $assignedJudges,
                'final_score' => $finalScore,
                'placement' => $registration->placement,
                'is_complete' => $finalScore !== null,
            ];
        }

        usort($rows, function (array $a, array $b): int {
            /** @var float|null $scoreA */
            $scoreA = $a['final_score'];
            /** @var float|null $scoreB */
            $scoreB = $b['final_score'];

            if ($scoreA === null && $scoreB === null) {
                return strcmp((string) $a['code'], (string) $b['code']);
            }

            if ($scoreA === null) {
                return 1;
            }

            if ($scoreB === null) {
                return -1;
            }

            return $scoreB <=> $scoreA ?: strcmp((string) $a['code'], (string) $b['code']);
        });

        $rank = 0;
        $position = 0;
        $previous = null;
        $counts = [];

        foreach ($rows as $index => $row) {
            /** @var float|null $score */
            $score = $row['final_score'];

            if ($score === null) {
                $rows[$index]['rank'] = null;

                continue;
            }

            $position++;

            if ($previous === null || $score !== $previous) {
                $rank = $position;
                $previous = $score;
            }

            $rows[$index]['rank'] = $rank;
            $counts[$rank] = ($counts[$rank] ?? 0) + 1;
        }

        foreach ($rows as $index => $row) {
            $rowRank = $row['rank'];
            $rows[$index]['is_tie'] = $rowRank !== null && ($counts[$rowRank] ?? 0) > 1;
        }

        return $rows;
    }

    /**
     * Saran juara 1–3 dari peringkat (seri boleh berbagi).
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    public function suggestions(array $rows): array
    {
        return array_values(array_filter(
            $rows,
            function (array $row): bool {
                /** @var int|null $rank */
                $rank = $row['rank'];

                return $rank !== null && $rank <= 3;
            },
        ));
    }
}

<?php

namespace App\Actions\Import;

use App\Enums\CompetitionCategory;
use App\Enums\Role;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\User;
use App\Services\Settings\Settings;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;

class PreviewCollectiveImport
{
    public const CACHE_TTL = 1800; // 30 menit

    /**
     * Validasi berkas impor (AC-F06-03/04/08) TANPA menyimpan data.
     * Hasil valid disimpan di cache dengan token (AC-F06-07).
     *
     * @return array{token: string, rows: array<int, array<string, mixed>>, entries: int, errors: array<int, array<string, mixed>>}
     */
    public function handle(
        User $user,
        Competition $competition,
        UploadedFile $file
    ): array {
        $this->assertOwnerInstitution($user, $competition);
        $rows = $this->parseFile($file, $competition);
        $maxRows = (int) Settings::get('import_max_rows', 300);

        if (count($rows) > $maxRows) {
            throw new BusinessRuleViolation("Jumlah baris melebihi batas {$maxRows} baris.");
        }

        $errors = [];
        $seenNames = [];
        $teamSizes = [];

        foreach ($rows as $i => $row) {
            [$name, $grade, $team] = [
                trim((string) ($row['nama_siswa'] ?? '')),
                $row['kelas'] ?? null,
                trim((string) ($row['tim'] ?? '')),
            ];

            $rowErrors = [];

            if ($name === '' || $grade === null || $grade === '') {
                $rowErrors[] = 'Nama siswa dan kelas wajib diisi.';
            }

            if ($name !== '') {
                $key = mb_strtolower($name).'|'.(int) $grade;
                if (isset($seenNames[$key])) {
                    $rowErrors[] = 'Nama + kelas ganda dalam berkas.';
                }
                $seenNames[$key] = true;

                // Jenjang harus cocok (BR-01)
                $expectedLevel = Participant::levelForGrade((int) $grade)->value;
                if ($expectedLevel !== $competition->level) {
                    $rowErrors[] = 'Kelas '.$grade.' tidak sesuai jenjang lomba.';
                }

                // Sudah terdaftar di lomba ini (AC-F06-08)
                if (Participant::where('owner_id', $user->id)
                    ->where('name', $name)
                    ->where('grade', (int) $grade)
                    ->whereHas('registrations', fn ($q) => $q->where('registrations.competition_id', $competition->id))
                    ->exists()) {
                    $rowErrors[] = 'Siswa sudah terdaftar di lomba ini.';
                }
            }

            if ($competition->category === CompetitionCategory::Team->value) {
                if ($team === '') {
                    $rowErrors[] = 'Nama tim wajib untuk lomba tim.';
                }
                $teamSizes[$team] = ($teamSizes[$team] ?? 0) + 1;
            }

            if (count($rowErrors) > 0) {
                $errors[] = [
                    'row' => $i + 1,
                    'message' => implode(' ', $rowErrors),
                ];
            }
        }

        // Ukuran tim dalam min..max (AC-F06-03)
        if ($competition->category === CompetitionCategory::Team->value) {
            $min = $competition->team_min ?? 2;
            $max = $competition->team_max ?? $min;

            foreach ($teamSizes as $team => $size) {
                if ($team === '' || $size < $min || $size > $max) {
                    $errors[] = [
                        'row' => null,
                        'message' => "Tim '{$team}' memiliki {$size} anggota (rentang {$min}–{$max}).",
                    ];
                }
            }
        }

        // Batas lomba per siswa (AC-F06-03): hitung entri aktif tiap siswa + entri baru
        $maxComp = (int) Settings::get('max_competitions_per_participant', 0);
        if ($maxComp > 0) {
            $newParticipants = Participant::where('owner_id', $user->id)
                ->whereIn('name', array_unique(array_map('trim', array_column($rows, 'nama_siswa'))))
                ->get(['name', 'grade'])
                ->keyBy(fn ($p) => mb_strtolower($p->name).'|'.$p->grade);

            $newEntriesPerName = [];
            foreach ($rows as $row) {
                $name = mb_strtolower(trim((string) ($row['nama_siswa'] ?? '')));
                $grade = (int) ($row['kelas'] ?? 0);
                $newEntriesPerName[$name.'|'.$grade] = ($newEntriesPerName[$name.'|'.$grade] ?? 0) + 1;
            }

            foreach ($rows as $i => $row) {
                $name = mb_strtolower(trim((string) ($row['nama_siswa'] ?? '')));
                $grade = (int) ($row['kelas'] ?? 0);
                $key = $name.'|'.$grade;

                if (! isset($newParticipants[$key])) {
                    continue;
                }

                /** @var Participant $existing */
                $existing = $newParticipants[$key];
                $activeCount = Registration::where('owner_id', $user->id)
                    ->whereIn('status', Registration::slotHoldingStatuses())
                    ->whereHas('members', fn ($q) => $q->where('participant_id', $existing->id))
                    ->count() + ($newEntriesPerName[$key] ?? 0);

                if ($activeCount > $maxComp) {
                    $errors[] = [
                        'row' => $i + 1,
                        'message' => "Siswa melebihi batas {$maxComp} lomba per peserta.",
                    ];
                    break; // cukup satu kali untuk pesan batas global
                }
            }
        }

        $token = Str::random(40);
        Cache::put('collective_import_'.$token, [
            'owner_id' => $user->id,
            'competition_id' => $competition->id,
            'rows' => $rows,
            'errors' => $errors,
        ], self::CACHE_TTL);

        return [
            'token' => $token,
            'rows' => $rows,
            'entries' => $this->countEntries($rows, $competition),
            'errors' => $errors,
        ];
    }

    private function assertOwnerInstitution(User $user, Competition $competition): void
    {
        if ($user->role !== Role::Institution) {
            throw new BusinessRuleViolation('Hanya akun lembaga yang dapat memakai pendaftaran kolektif.');
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseFile(UploadedFile $file, Competition $competition): array
    {
        $name = $file->getClientOriginalName();
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if ($ext === 'csv') {
            return $this->parseCsv($file->get());
        }

        if ($ext === 'xlsx' || $ext === 'xls') {
            return $this->parseXlsx($file->getPathname());
        }

        throw new BusinessRuleViolation('Format berkas harus xlsx atau csv.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseCsv(string $content): array
    {
        $content = mb_substr($content, 0, 3) === "\u{FEFF}" ? mb_substr($content, 3) : $content;
        $lines = preg_split('/\r\n|\n/', trim($content));
        $rows = [];
        $header = null;

        foreach ($lines as $line) {
            if ($line === '') {
                continue;
            }
            $cells = str_getcsv($line);

            if ($header === null) {
                $header = array_map(fn ($c) => mb_strtolower(trim((string) $c)), $cells);

                continue;
            }

            $row = [];
            foreach ($header as $idx => $col) {
                $row[$col] = $cells[$idx] ?? '';
            }
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseXlsx(string $path): array
    {
        $reader = new Xlsx;
        $spreadsheet = $reader->load($path);
        $rows = [];
        $sheet = $spreadsheet->getActiveSheet();
        $header = null;

        $highestRow = $sheet->getHighestDataRow();
        $highestCol = $sheet->getHighestDataColumn();
        $matrix = $sheet->rangeToArray('A1:'.$highestCol.$highestRow, null, true, false);

        foreach ($matrix as $cells) {
            $values = array_values(array_map(fn ($v) => $v ?? '', $cells));

            if (array_filter($values, fn ($v) => trim((string) $v) !== '') === []) {
                continue;
            }

            if ($header === null) {
                $header = array_map(fn ($c) => mb_strtolower(trim((string) $c)), $values);

                continue;
            }

            $row = [];
            foreach ($header as $idx => $col) {
                $row[$col] = $values[$idx] ?? '';
            }
            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function countEntries(array $rows, Competition $competition): int
    {
        if ($competition->category === CompetitionCategory::Team->value) {
            $teams = [];
            foreach ($rows as $row) {
                $team = trim((string) ($row['tim'] ?? ''));
                if ($team !== '') {
                    $teams[$team] = true;
                }
            }

            return count($teams);
        }

        return count($rows);
    }
}

<?php

namespace App\Actions\Import;

use App\Actions\Invoice\PickUniqueCode;
use App\Enums\CompetitionCategory;
use App\Enums\InvoiceStatus;
use App\Enums\RegistrationStatus;
use App\Events\InvoiceCreated;
use App\Exceptions\BusinessRuleViolation;
use App\Models\BankAccount;
use App\Models\Competition;
use App\Models\Institution;
use App\Models\Invoice;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use App\Models\User;
use App\Services\Settings\Settings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommitCollectiveImport
{
    /**
     * Komit pratinjau impor (token) — semua atau tidak sama sekali (AC-F06-05/06).
     *
     * @return array{invoice: Invoice, registrations: Registration[]}
     */
    public function handle(User $user, Competition $competition, string $token): array
    {
        $payload = Cache::get('collective_import_'.$token);

        // AC-F06-07: token kedaluwarsa / milik pengguna lain
        if (! $payload || $payload['owner_id'] !== $user->id || $payload['competition_id'] !== $competition->id) {
            throw new BusinessRuleViolation('Pratinjau impor tidak valid atau sudah kedaluwarsa. Ulangi impor.');
        }

        if (count($payload['errors']) > 0) {
            throw new BusinessRuleViolation('Terdapat baris bermasalah. Perbaiki berkas lalu impor ulang.');
        }

        $rows = $payload['rows'];
        $totalEntries = $this->buildEntries($rows, $competition, $user);

        if ($totalEntries === 0) {
            throw new BusinessRuleViolation('Tidak ada entri valid untuk diproses.');
        }

        $result = DB::transaction(function () use ($user, $competition, $rows, $totalEntries) {
            // AC-F06-06: kuota untuk SELURUH jumlah sekaligus
            $slotHolding = Registration::forCompetition($competition->id)
                ->slotHolding()
                ->count();

            if ($competition->quota !== null && $slotHolding + $totalEntries > $competition->quota) {
                throw new BusinessRuleViolation(
                    "Kuota lomba tidak cukup untuk {$totalEntries} entri."
                );
            }

            // Reuse / buat peserta (AC-F06-08)
            $participants = $this->resolveParticipants($user, $competition, $rows);

            $registrations = [];

            // Entri per tim (baris tim sama = 1 entri) atau per individu
            if ($competition->category === CompetitionCategory::Team->value) {
                $byTeam = [];
                foreach ($rows as $row) {
                    $team = trim((string) ($row['tim'] ?? ''));
                    if ($team === '') {
                        continue;
                    }
                    $byTeam[$team][] = $row;
                }

                foreach ($byTeam as $teamName => $teamRows) {
                    $reg = Registration::create([
                        'code' => $this->generateCode($competition, $teamName),
                        'competition_id' => $competition->id,
                        'owner_id' => $user->id,
                        'status' => RegistrationStatus::AwaitingPayment,
                        'team_name' => $teamName,
                        'fee' => 0,
                        'submitted_at' => now('Asia/Jakarta'),
                        'requirements_accepted_at' => now('Asia/Jakarta'),
                        'consented_at' => now('Asia/Jakarta'),
                    ]);

                    foreach ($teamRows as $row) {
                        $participant = $this->participantFor($participants, $row);
                        RegistrationMember::create([
                            'registration_id' => $reg->id,
                            'participant_id' => $participant->id,
                            'competition_id' => $competition->id,
                        ]);
                    }

                    $registrations[] = $reg;
                }
            } else {
                foreach ($rows as $row) {
                    $reg = Registration::create([
                        'code' => $this->generateCode($competition, trim((string) ($row['nama_siswa'] ?? ''))),
                        'competition_id' => $competition->id,
                        'owner_id' => $user->id,
                        'status' => RegistrationStatus::AwaitingPayment,
                        'fee' => 0,
                        'submitted_at' => now('Asia/Jakarta'),
                        'requirements_accepted_at' => now('Asia/Jakarta'),
                        'consented_at' => now('Asia/Jakarta'),
                    ]);

                    $participant = $this->participantFor($participants, $row);
                    RegistrationMember::create([
                        'registration_id' => $reg->id,
                        'participant_id' => $participant->id,
                        'competition_id' => $competition->id,
                    ]);

                    $registrations[] = $reg;
                }
            }

            // AC-F06-05: SATU tagihan = jumlah entri × biaya + kode unik
            $bankAccount = BankAccount::active()->first();

            if (! $bankAccount) {
                throw new BusinessRuleViolation('Tidak ada rekening aktif. Hubungi panitia.');
            }

            $subtotal = (int) $competition->fee * $totalEntries;
            $uniqueCode = app(PickUniqueCode::class)->handle($subtotal);
            $dueHours = (int) Settings::get('payment_due_hours', 48);

            $invoice = Invoice::create([
                'number' => 'INV-'.now()->format('ymd').'-'.Str::upper(Str::random(6)),
                'owner_id' => $user->id,
                'subtotal' => $subtotal,
                'unique_code' => $uniqueCode,
                'discount' => 0,
                'total' => $subtotal + $uniqueCode,
                'status' => InvoiceStatus::Unpaid,
                'bank_name' => $bankAccount->bank_name,
                'bank_account_number' => $bankAccount->account_number,
                'bank_account_holder' => $bankAccount->account_holder,
                'due_at' => now('Asia/Jakarta')->addHours($dueHours),
            ]);

            foreach ($registrations as $reg) {
                $reg->forceFill([
                    'fee' => $competition->fee,
                    'invoice_id' => $invoice->id,
                ])->save();
            }

            return $invoice;
        });

        Cache::forget('collective_import_'.$token);
        event(new InvoiceCreated($result));

        $registrations = Registration::where('invoice_id', $result->id)->get()->all();

        return [
            'invoice' => $result,
            'registrations' => $registrations,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<string, Participant>
     */
    private function resolveParticipants(User $user, Competition $competition, array $rows): array
    {
        $map = [];

        foreach ($rows as $row) {
            $name = trim((string) ($row['nama_siswa'] ?? ''));
            $grade = (int) ($row['kelas'] ?? 0);

            if ($name === '' || $grade < 1) {
                continue;
            }

            $key = mb_strtolower($name).'|'.$grade;

            if (isset($map[$key])) {
                continue;
            }

            $existing = Participant::where('owner_id', $user->id)
                ->where('name', $name)
                ->where('grade', $grade)
                ->first();

            if ($existing) {
                $map[$key] = $existing;

                continue;
            }

            /** @var Institution|null $institution */
            $institution = $user->institution;

            $map[$key] = Participant::create([
                'owner_id' => $user->id,
                'institution_id' => $institution instanceof Institution ? $institution->id : null,
                'name' => $name,
                'grade' => $grade,
                'level' => Participant::levelForGrade($grade)->value,
                'school_name' => $institution instanceof Institution ? $institution->name : 'Sekolah',
                'school_city' => $institution instanceof Institution ? $institution->city : null,
            ]);
        }

        return $map;
    }

    /**
     * @param  array<string, Participant>  $participants
     * @param  array<string, mixed>  $row
     */
    private function participantFor(array $participants, array $row): Participant
    {
        $name = trim((string) ($row['nama_siswa'] ?? ''));
        $grade = (int) ($row['kelas'] ?? 0);
        $key = mb_strtolower($name).'|'.$grade;

        if (! isset($participants[$key])) {
            throw new BusinessRuleViolation('Data siswa tidak lengkap.');
        }

        return $participants[$key];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return int jumlah entri yang akan dibuat (tim = jumlah tim, individu = jumlah baris valid)
     */
    private function buildEntries(array $rows, Competition $competition, User $user): int
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

        return count(array_filter($rows, fn ($row) => trim((string) ($row['nama_siswa'] ?? '')) !== ''));
    }

    private function generateCode(Competition $competition, string $identifier): string
    {
        $levelCode = $competition->level === 'sd_mi' ? 'SD' : 'SMP';
        $year = now()->format('y');
        $prefix = "BF{$year}-{$levelCode}-";
        $sequence = Registration::where('code', 'like', $prefix.'%')->count() + 1;

        do {
            $code = $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
            $sequence++;
        } while (Registration::where('code', $code)->exists());

        return $code;
    }
}

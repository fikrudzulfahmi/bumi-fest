<?php

/**
 * AC-F13-06 — Uji konkurensi kuota di MySQL.
 *
 * BUKAN test Pest. Jalankan manual terhadap MySQL (SQLite tidak menghormati
 * lockForUpdate, BLUEPRINT §15). Membuktikan: 50 kirim paralel ke lomba
 * berkuota 10 → tepat 10 entri berhasil, sisanya ditolak.
 *
 * Cara kerja: spawn N worker CLI paralel; tiap worker membuat satu entri
 * draft lalu SubmitRegistration. Karena tiap worker proses terpisah, baris
 * lomba benar-benar dikunci bersamaan (lockForUpdate).
 *
 * Prasyarat:
 *   - .env menunjuk MySQL (DB_CONNECTION=mysql) + `migrate:fresh --seed`.
 *   - ext `pcntl` TIDAK diperlukan (pakai proc_open).
 *
 * Jalankan:
 *   php tests/load/quota_concurrency.php <competition_id> <jumlah_paralel>
 */

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

$competitionId = (int) ($argv[1] ?? 1);
$concurrent = (int) ($argv[2] ?? 50);

$competition = Competition::findOrFail($competitionId);
$quota = (int) $competition->quota;

echo "Lomba: {$competition->name} (kuota {$quota})\n";
echo "Paralel: {$concurrent}\n";
echo str_repeat('-', 50)."\n";

// Bersihkan entri uji pada lomba ini (draft & tagihan lama).
Registration::where('competition_id', $competitionId)->delete();

$baseDir = __DIR__;
$php = PHP_BINARY;
$artisan = base_path('artisan');

// Buat worker script sekali.
$worker = $baseDir.'/.quota_worker.php';
file_put_contents($worker, <<<'PHP'
<?php
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$cid, $uid] = [ (int)$argv[1], (int)$argv[2] ];

use App\Models\Competition;
use App\Models\Registration;
use App\Models\User;
use App\Actions\Registration\SubmitRegistration;
use App\Enums\RegistrationStatus;

try {
    $competition = Competition::findOrFail($cid);
    $user = User::findOrFail($uid);

    $registration = Registration::create([
        'competition_id' => $cid,
        'owner_id' => $uid,
        'status' => RegistrationStatus::Draft->value,
        'fee' => $competition->fee,
    ]);

    app(SubmitRegistration::class)->handle($user, $registration);
    echo "OK\n";
} catch (Throwable $e) {
    echo "GAGAL: ".$e->getMessage()."\n";
}
PHP);

$users = User::factory()->count($concurrent)->create();

$procs = [];
$ok = 0;

foreach ($users as $user) {
    $cmd = escapeshellarg($php).' '.escapeshellarg($worker).' '.$competitionId.' '.$user->id;
    $procs[] = proc_open($cmd, [1 => ['pipe', 'w']], $pipes);
}

foreach ($procs as $proc) {
    $out = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    proc_close($proc);

    if (str_starts_with(trim($out), 'OK')) {
        $ok++;
    }
}

unlink($worker);

$slots = Registration::where('competition_id', $competitionId)
    ->whereIn('status', [RegistrationStatus::AwaitingPayment->value, RegistrationStatus::AwaitingVerification->value, RegistrationStatus::Verified->value])
    ->count();

echo 'Berhasil: '.$ok."\n";
echo 'Slot terisi: '.$slots."\n";

if ($ok !== $quota || $slots !== $quota) {
    echo "❌ GAGAL: berhasil ({$ok}) / slot ({$slots}) ≠ kuota ({$quota}).\n";
    exit(1);
}

echo "✅ LULUS: tepat {$quota} entri berhasil dari {$concurrent} paralel.\n";

<?php

namespace App\Jobs;

use App\Exports\AdminRegistrationExport;
use App\Queries\RegistrationQuery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

/**
 * Ekspor > ambang config dijalankan di antrean agar request tidak menggantung.
 * Berkas ditulis ke disk privat `local` dan diunduh lewat rute ber-otorisasi.
 */
class ExportRegistrationsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public int $timeout = 300;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        public readonly array $filters,
        public readonly string $filename,
    ) {}

    public function handle(): void
    {
        $path = 'exports/'.$this->filename;

        Excel::store(
            new AdminRegistrationExport(RegistrationQuery::apply($this->filters)->with([
                'competition:id,name,level',
                'invoice:id,number,total',
                'members.participant',
            ])),
            $path,
            config('bumifest.export_disk', 'local'),
        );
    }

    public function failed(?Throwable $exception): void
    {
        Storage::disk(config('bumifest.export_disk', 'local'))->delete('exports/'.$this->filename);
        report($exception);
    }
}

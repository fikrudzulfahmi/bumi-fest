<?php

namespace App\Actions\Certificate;

use App\Models\Certificate;
use App\Models\Institution;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

/**
 * AC-F12-07: ZIP berisi semua sertifikat siswa satu lembaga, nama file aman,
 * tidak memuat sertifikat sekolah lain.
 */
class BuildCertificateZip
{
    public function handle(Institution $institution): string
    {
        $certificates = Certificate::query()
            ->whereHas('participant', fn ($q) => $q->where('institution_id', $institution->id))
            ->with(['participant', 'registration.competition'])
            ->orderBy('number')
            ->get();

        $tmp = tempnam(sys_get_temp_dir(), 'certzip');
        $tmp = $tmp !== false ? $tmp : sys_get_temp_dir().'/certzip-'.Str::uuid().'.zip';

        $zip = new ZipArchive;
        $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $usedNames = [];

        foreach ($certificates as $certificate) {
            $filePath = $certificate->file_path;

            if ($filePath === null || ! Storage::disk('local')->exists($filePath)) {
                continue;
            }

            $base = $this->safeName($certificate);

            $name = $base;
            $suffix = 2;

            while (isset($usedNames[$name])) {
                $name = $base.' ('.$suffix.')';
                $suffix++;
            }

            $usedNames[$name] = true;
            $zip->addFromString($name, Storage::disk('local')->get($filePath));
        }

        $zip->close();

        $zipPath = 'certificate-zips/'.$institution->id.'-'.Str::uuid().'.zip';
        Storage::disk('local')->put($zipPath, (string) file_get_contents($tmp));

        if (is_file($tmp)) {
            unlink($tmp);
        }

        return $zipPath;
    }

    private function safeName(Certificate $certificate): string
    {
        $participant = $certificate->participant;
        $competition = $certificate->registration->competition;

        $name = trim((string) $participant->name);
        $name = Str::ascii($name, 'id');
        $name = preg_replace('/[^A-Za-z0-9]+/', '-', $name) ?? 'peserta';
        $name = trim($name, '-');

        $lomba = trim((string) $competition->name);
        $lomba = Str::ascii($lomba, 'id');
        $lomba = preg_replace('/[^A-Za-z0-9]+/', '-', $lomba) ?? 'lomba';
        $lomba = trim($lomba, '-');

        return ($name !== '' ? $name : 'peserta').'-'.($lomba !== '' ? $lomba : 'lomba').'.pdf';
    }
}

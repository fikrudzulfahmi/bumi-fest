<?php

return [
    /*
    | Ekspor lebih dari ambang ini dijalankan sebagai job berantrean
    | (AC-F09-03) agar request tidak menggantung.
    */
    'export_queue_threshold' => (int) env('EXPORT_QUEUE_THRESHOLD', 2000),

    'export_disk' => env('EXPORT_DISK', 'local'),
];

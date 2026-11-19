<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProofUploaded
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Invoice $invoice,
    ) {}
}

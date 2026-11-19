<?php

namespace App\Console\Commands;

use App\Actions\Payment\ExpireOverdueInvoices;
use Illuminate\Console\Command;

class ExpireInvoices extends Command
{
    protected $signature = 'invoices:expire';

    protected $description = 'Kedaluwarsakan tagihan unpaid/rejected yang melewati jatuh tempo';

    public function handle(ExpireOverdueInvoices $action): int
    {
        $count = $action->handle();

        $this->info("Tagihan kedaluwarsa: {$count}");

        return self::SUCCESS;
    }
}

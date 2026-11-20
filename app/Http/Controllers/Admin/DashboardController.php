<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvoiceStatus;
use App\Enums\Level;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AC-F09-01: angka dasbor dihitung dengan agregasi SQL (tanpa N+1).
 */
class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $activeStatuses = array_map(
            fn (RegistrationStatus $s) => $s->value,
            Registration::slotHoldingStatuses(),
        );

        $perCompetition = DB::table('registrations')
            ->join('competitions', 'competitions.id', '=', 'registrations.competition_id')
            ->whereIn('registrations.status', $activeStatuses)
            ->groupBy('competitions.id', 'competitions.name', 'competitions.level', 'competitions.quota')
            ->orderByDesc(DB::raw('COUNT(registrations.id)'))
            ->get([
                'competitions.id as competition_id',
                'competitions.name as competition_name',
                'competitions.level as competition_level',
                'competitions.quota as competition_quota',
                DB::raw('COUNT(registrations.id) as registrations_count'),
            ])
            ->map(fn (object $row) => [
                'id' => (int) $row->competition_id,
                'name' => (string) $row->competition_name,
                'level' => (string) $row->competition_level,
                'level_label' => Level::tryFrom((string) $row->competition_level)?->label() ?? (string) $row->competition_level,
                'quota' => $row->competition_quota === null ? null : (int) $row->competition_quota,
                'registrations_count' => (int) $row->registrations_count,
            ])
            ->values()
            ->all();

        $paid = Invoice::query()
            ->where('status', InvoiceStatus::Paid)
            ->selectRaw('COUNT(*) as invoices_count, COALESCE(SUM(total), 0) as total_sum, COALESCE(SUM(subtotal), 0) as subtotal_sum')
            ->first();

        $nearDue = Invoice::query()
            ->whereIn('status', [InvoiceStatus::Unpaid, InvoiceStatus::Rejected])
            ->whereNotNull('due_at')
            ->whereBetween('due_at', [now('Asia/Jakarta'), now('Asia/Jakarta')->copy()->addHours(24)])
            ->count();

        return Inertia::render('admin/Dashboard', [
            'metrics' => [
                'registrations_total' => Registration::query()->whereIn('status', $activeStatuses)->count(),
                'registrations_verified' => Registration::query()
                    ->where('status', RegistrationStatus::Verified->value)
                    ->count(),
                'payments_received' => (int) ($paid->total_sum ?? 0),
                'payments_received_net' => (int) ($paid->subtotal_sum ?? 0),
                'payments_count' => (int) ($paid->invoices_count ?? 0),
                'awaiting_verification' => Invoice::query()
                    ->where('status', InvoiceStatus::AwaitingVerification->value)
                    ->count(),
                'invoices_near_due' => $nearDue,
                'institutions_total' => DB::table('institutions')->count(),
                'users_total' => User::query()->count(),
            ],
            'perCompetition' => $perCompetition,
            'nearDueInvoices' => Invoice::query()
                ->with('owner:id,name,email')
                ->whereIn('status', [InvoiceStatus::Unpaid, InvoiceStatus::Rejected])
                ->whereNotNull('due_at')
                ->whereBetween('due_at', [now('Asia/Jakarta'), now('Asia/Jakarta')->copy()->addHours(24)])
                ->orderBy('due_at')
                ->limit(10)
                ->get()
                ->map(fn (Invoice $invoice) => [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'total' => $invoice->total,
                    'due_at' => $invoice->due_at?->toIso8601String(),
                    'owner' => $invoice->owner?->name,
                ])
                ->all(),
            'generatedAt' => Carbon::now('Asia/Jakarta')->toIso8601String(),
        ]);
    }
}

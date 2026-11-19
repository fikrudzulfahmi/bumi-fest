<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

/**
 * AC-F13-01: halaman riwayat aktivitas (filter pengguna, jenis, tanggal).
 */
class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $subject = trim($request->string('subject')->toString());
        $description = trim($request->string('description')->toString());
        $from = $request->string('from')->toString();
        $to = $request->string('to')->toString();

        $activities = Activity::query()
            ->with('causer')
            ->when($subject !== '', fn ($q) => $q->where('description', 'like', '%'.$subject.'%'))
            ->when($description !== '', fn ($q) => $q->where('description', $description))
            ->when($from !== '', fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to !== '', fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->orderByDesc('created_at')
            ->paginate(30)
            ->withQueryString();

        /** @var array<int, array<string, mixed>> $items */
        $items = $activities->getCollection()
            ->map(function (Activity $activity): array {
                /** @var Model|null $causer */
                $causer = $activity->causer;

                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'causer_name' => $causer !== null ? (string) $causer->getAttribute('name') : 'Sistem',
                    'subject_type' => $activity->subject_type !== null ? class_basename($activity->subject_type) : null,
                    'properties' => $activity->properties->toArray(),
                    'created_at' => $activity->created_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        $activities->setCollection(collect($items));

        return Inertia::render('admin/logs/Index', [
            'activities' => $activities,
            'filters' => ['subject' => $subject, 'description' => $description, 'from' => $from, 'to' => $to],
            'descriptions' => Activity::query()
                ->distinct()
                ->orderBy('description')
                ->pluck('description'),
        ]);
    }
}

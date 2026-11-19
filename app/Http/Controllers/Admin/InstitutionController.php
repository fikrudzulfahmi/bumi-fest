<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstitutionResource;
use App\Models\Institution;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstitutionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('q')->toString());

        $institutions = Institution::query()
            ->with('user:id,name,email,whatsapp,is_active')
            ->withCount('participants')
            ->when($search !== '', fn ($query) => $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('npsn', 'like', '%'.$search.'%')
                    ->orWhere('city', 'like', '%'.$search.'%');
            }))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/institutions/Index', [
            // Paginator apa adanya (data/links/total) — frontend butuh links.map & total.
            'institutions' => $institutions->through(
                fn (Institution $institution) => (new InstitutionResource($institution))->resolve(),
            ),
            'filters' => ['q' => $search],
        ]);
    }

    public function show(Institution $institution): Response
    {
        $institution->load(['user:id,name,email,whatsapp,is_active']);
        $institution->loadCount('participants');

        return Inertia::render('admin/institutions/Show', [
            'institution' => (new InstitutionResource($institution))->resolve(),
            'participants' => $institution->participants()
                ->orderBy('name')
                ->get(['id', 'name', 'grade', 'level', 'school_name', 'school_city'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'grade' => $p->grade,
                    'level' => $p->level,
                    'school_name' => $p->school_name,
                ])
                ->all(),
        ]);
    }
}

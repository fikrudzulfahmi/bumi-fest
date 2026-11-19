<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Judge\AssignJudge;
use App\Actions\Judge\CreateJudgeAccount;
use App\Actions\Judge\RemoveJudgeAssignment;
use App\Enums\Level;
use App\Enums\Role;
use App\Exceptions\BusinessRuleViolation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreJudgeRequest;
use App\Http\Resources\AdminUserResource;
use App\Models\Competition;
use App\Models\JudgeAssignment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JudgeController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim($request->string('q')->toString());

        $judges = User::query()
            ->where('role', Role::Judge->value)
            ->when($search !== '', fn ($query) => $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            }))
            ->with(['judgeAssignments.competition:id,name,level'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/judges/Index', [
            // Paginator apa adanya (data/links/total) — frontend butuh links.map & total.
            'judges' => $judges->through(
                fn (User $judge) => (new AdminUserResource($judge))->resolve(),
            ),
            'filters' => ['q' => $search],
            'competitions' => Competition::query()
                ->orderBy('name')
                ->get(['id', 'name', 'level', 'slug'])
                ->map(fn (Competition $competition) => [
                    'id' => $competition->id,
                    'name' => $competition->name,
                    'slug' => $competition->slug,
                    'level' => $competition->level,
                    'level_label' => Level::tryFrom($competition->level)?->label(),
                ])
                ->values(),
        ]);
    }

    /**
     * AC-F10-01: buat akun juri + kirim tautan atur kata sandi.
     */
    public function store(StoreJudgeRequest $request, CreateJudgeAccount $action): RedirectResponse
    {
        $judge = $action->handle($request->validated());

        return back()->with(
            'success',
            'Akun juri '.$judge->name.' dibuat. Tautan atur kata sandi dikirim ke '.$judge->email.'.',
        );
    }

    /**
     * AC-F10-03: penugasan unik per pasangan juri–lomba.
     */
    public function assign(Request $request, User $judge, AssignJudge $action): RedirectResponse
    {
        $validated = $request->validate([
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
        ]);

        try {
            $action->handle($judge, (int) $validated['competition_id']);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Juri '.$judge->name.' ditugaskan ke lomba.');
    }

    public function unassign(JudgeAssignment $assignment, RemoveJudgeAssignment $action): RedirectResponse
    {
        try {
            $action->handle($assignment);
        } catch (BusinessRuleViolation $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Penugasan juri dihapus.');
    }

    /**
     * AC-F10-07 dicek middleware role:admin pada grup rute.
     * Nonaktif juri memakai UserController::toggleActive (F09).
     */
}

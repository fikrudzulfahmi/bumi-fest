<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $role = $request->string('role')->toString();
        $search = trim($request->string('q')->toString());

        $users = User::query()
            ->with('institution:id,name')
            ->withCount('registrations')
            ->when(
                $role !== '' && in_array($role, array_column(Role::cases(), 'value'), true),
                fn ($query) => $query->where('role', $role)
            )
            ->when($search !== '', fn ($query) => $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('whatsapp', 'like', '%'.$search.'%');
            }))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/users/Index', [
            'users' => AdminUserResource::collection($users)->response()->getData(true),
            'filters' => ['role' => $role, 'q' => $search],
            'roles' => array_map(fn (Role $r) => [
                'value' => $r->value,
                'label' => $r->label(),
            ], Role::cases()),
        ]);
    }

    /**
     * AC-F09-05: nonaktifkan akun mencegah login (lihat LoginRequest).
     */
    public function toggleActive(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()?->id) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }

        if ($user->isAdmin() && $user->is_active) {
            $activeAdmins = User::query()
                ->where('role', Role::Admin->value)
                ->where('is_active', true)
                ->where('id', '!=', $user->id)
                ->count();

            if ($activeAdmins === 0) {
                return back()->with('error', 'Minimal satu admin harus tetap aktif.');
            }
        }

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with(
            'success',
            $user->is_active
                ? 'Akun '.$user->name.' diaktifkan.'
                : 'Akun '.$user->name.' dinonaktifkan. Pengguna tidak dapat masuk.',
        );
    }
}

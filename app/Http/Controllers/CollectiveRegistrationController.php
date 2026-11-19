<?php

namespace App\Http\Controllers;

use App\Actions\Import\CommitCollectiveImport;
use App\Actions\Import\PreviewCollectiveImport;
use App\Enums\Role;
use App\Exceptions\BusinessRuleViolation;
use App\Models\Competition;
use App\Models\Participant;
use App\Models\Registration;
use App\Models\RegistrationMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CollectiveRegistrationController extends Controller
{
    /**
     * AC-F06-01: hanya peran institution.
     */
    public function create(string $level, Competition $competition): InertiaResponse
    {
        abort_unless(auth()->user()->role === Role::Institution, 403);
        abort_unless($competition->level === $level, 404);
        abort_unless($competition->status === 'published', 404);

        $preview = session('collective_preview');

        return Inertia::render('registrations/Collective', [
            'competition' => [
                'id' => $competition->id,
                'slug' => $competition->slug,
                'name' => $competition->name,
                'category' => $competition->category,
                'team_min' => $competition->team_min,
                'team_max' => $competition->team_max,
                'fee' => $competition->fee,
                'quota' => $competition->quota,
            ],
            'level' => $level,
            'preview' => $preview,
        ]);
    }

    /**
     * AC-F06-02: template unduh (kolom nama_siswa, kelas, tim).
     */
    public function template(string $level, Competition $competition): StreamedResponse
    {
        abort_unless(auth()->user()->role === Role::Institution, 403);

        $rows = ['nama_siswa', 'kelas'];

        if ($competition->category === 'team') {
            $rows[] = 'tim';
        }

        $content = implode(',', $rows)."\n";

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, 'template-pendaftaran.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * AC-F06-03/04/08: pratinjau — validasi tanpa menyimpan.
     */
    public function preview(string $level, Competition $competition, Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->role === Role::Institution, 403);
        abort_unless($competition->level === $level, 404);

        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:2048'],
        ]);

        try {
            $result = app(PreviewCollectiveImport::class)->handle(auth()->user(), $competition, $request->file('file'));
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['file' => $e->getMessage()]);
        }

        session(['collective_preview' => [
            'token' => $result['token'],
            'competition_id' => $competition->id,
            'entries' => $result['entries'],
            'errors' => $result['errors'],
            'rows' => array_slice($result['rows'], 0, 200),
        ]]);

        return back()->with('preview', true);
    }

    /**
     * AC-F06-05/06/07: commit pratinjau — satu tagihan, atomik.
     */
    public function commit(string $level, Competition $competition, Request $request): RedirectResponse
    {
        abort_unless(auth()->user()->role === Role::Institution, 403);
        abort_unless($competition->level === $level, 404);

        $request->validate([
            'token' => ['required', 'string', 'max:64'],
        ]);

        try {
            $result = app(CommitCollectiveImport::class)->handle(auth()->user(), $competition, $request->input('token'));
        } catch (BusinessRuleViolation $e) {
            return back()->withErrors(['token' => $e->getMessage()]);
        }

        session()->forget('collective_preview');

        return redirect()
            ->route('collective-registrations.index')
            ->with('success', 'Pendaftaran kolektif dikirim. Tagihan: '.$result['invoice']->number.' (Rp '.number_format($result['invoice']->total, 0, ',', '.').').');
    }

    /**
     * AC-F06-10: dasbor sekolah — hanya siswa/entri milik sekolah itu.
     */
    public function index(): InertiaResponse
    {
        $user = auth()->user();
        abort_unless($user->role === Role::Institution, 403);

        $registrations = Registration::where('owner_id', $user->id)
            ->with('competition:id,name,slug,level')
            ->latest()
            ->get();

        $items = $registrations
            ->map(function (Registration $r) {
                $members = RegistrationMember::where('registration_id', $r->id)
                    ->with('participant:id,name,grade')
                    ->get();

                return [
                    'id' => $r->id,
                    'code' => $r->code,
                    'status' => $r->status->value,
                    'status_label' => $r->status->label(),
                    'competition_name' => $r->competition->name,
                    'fee' => $r->fee,
                    'team_name' => $r->team_name,
                    'member_names' => $members->map(fn ($m) => $m->participant->name)->all(),
                ];
            })
            ->values();

        $schoolParticipants = Participant::forOwner($user->id)->count();

        return Inertia::render('registrations/SchoolDashboard', [
            'registrations' => $items,
            'schoolParticipants' => $schoolParticipants,
        ]);
    }
}

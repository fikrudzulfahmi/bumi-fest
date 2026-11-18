<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Setting\UpdateSettings;
use App\Http\Controllers\Controller;
use App\Http\Requests\SettingRequest;
use App\Services\Settings\Settings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings/Edit', [
            'settings' => [
                'event_name' => Settings::get('event_name', ''),
                'contact_whatsapp' => Settings::get('contact_whatsapp', ''),
                'contact_email' => Settings::get('contact_email', ''),
                'payment_due_hours' => Settings::get('payment_due_hours', 48),
                'max_competitions_per_participant' => Settings::get('max_competitions_per_participant'),
                'import_max_rows' => Settings::get('import_max_rows', 300),
            ],
        ]);
    }

    public function update(SettingRequest $request): RedirectResponse
    {
        (new UpdateSettings)->handle($request->validated());

        return redirect()->route('admin.settings.edit')
            ->with('success', 'Pengaturan berhasil disimpan.');
    }
}

<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\CompetitionController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:participant,institution'])->group(function () {
    Route::get('/portal', [PortalController::class, 'index'])->name('portal.index');
    Route::get('/portal/{level}', [PortalController::class, 'level'])->name('portal.level');

    // F05 — siswa & pendaftaran
    Route::get('/siswa', [ParticipantController::class, 'index'])->name('participants.index');
    Route::post('/siswa', [ParticipantController::class, 'store'])->name('participants.store');
    Route::put('/siswa/{participant}', [ParticipantController::class, 'update'])->name('participants.update');
    Route::delete('/siswa/{participant}', [ParticipantController::class, 'destroy'])->name('participants.destroy');

    Route::get('/pendaftaran', [RegistrationController::class, 'index'])->name('registrations.index');
    Route::get('/pendaftaran/{registration}', [RegistrationController::class, 'edit'])->name('registrations.edit');
    Route::post('/pendaftaran/{registration}/cancel', [RegistrationController::class, 'cancel'])->name('registrations.cancel');
});

Route::middleware(['auth', 'verified', 'role:participant,institution'])->group(function () {
    // /portal/{level}/lomba/{competition:slug}/daftar — BR-01: level URL harus sesuai lomba
    Route::get('/portal/{level}/lomba/{competition:slug}/daftar', [RegistrationController::class, 'create'])->name('registrations.create');
    Route::post('/portal/{level}/lomba/{competition:slug}/daftar', [RegistrationController::class, 'store'])->name('registrations.store');
    Route::post('/portal/{level}/lomba/{competition:slug}/daftar/{registration}/kirim', [RegistrationController::class, 'submit'])->name('registrations.submit');
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('competitions', CompetitionController::class);
    Route::post('competitions/{competition}/publish', [CompetitionController::class, 'publish'])->name('competitions.publish');
    Route::post('competitions/{competition}/archive', [CompetitionController::class, 'archive'])->name('competitions.archive');
    Route::post('competitions/{competition}/duplicate', [CompetitionController::class, 'duplicate'])->name('competitions.duplicate');

    Route::resource('bank-accounts', BankAccountController::class);

    Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');

    Route::resource('announcements', AnnouncementController::class);
    Route::post('announcements/{announcement}/publish', [AnnouncementController::class, 'publish'])->name('announcements.publish');
    Route::post('announcements/{announcement}/unpublish', [AnnouncementController::class, 'unpublish'])->name('announcements.unpublish');
});

require __DIR__.'/auth.php';

<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\CompetitionController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\CollectiveRegistrationController;
use App\Http\Controllers\InvoiceController;
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
    Route::post('/pendaftaran/{registration}/dokumen', [RegistrationController::class, 'uploadDocument'])->name('registrations.upload-document');
    Route::post('/pendaftaran/{registration}/ganti-anggota', [RegistrationController::class, 'swapMember'])->name('registrations.swap-member');

    // F07 — tagihan & bukti pembayaran
    Route::get('/tagihan', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::post('/tagihan/{invoice}/bukti', [InvoiceController::class, 'uploadProof'])->name('invoices.upload-proof');
});

// F07: detail & pratinjau bukti — otorisasi lewat InvoicePolicy (pemilik atau admin)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/tagihan/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('/tagihan/{invoice}/bukti', [InvoiceController::class, 'proof'])->name('invoices.proof');
});

Route::middleware(['auth', 'verified', 'role:participant,institution'])->group(function () {
    // /portal/{level}/lomba/{competition:slug}/daftar — BR-01: level URL harus sesuai lomba
    Route::get('/portal/{level}/lomba/{competition:slug}/daftar', [RegistrationController::class, 'create'])->name('registrations.create');
    Route::post('/portal/{level}/lomba/{competition:slug}/daftar', [RegistrationController::class, 'store'])->name('registrations.store');
    Route::post('/portal/{level}/lomba/{competition:slug}/daftar/{registration}/kirim', [RegistrationController::class, 'submit'])->name('registrations.submit');
});

// F06: pendaftaran kolektif — hanya peran institution (AC-F06-01)
Route::middleware(['auth', 'verified', 'role:institution'])->group(function () {
    Route::get('/daftar-kolektif', [CollectiveRegistrationController::class, 'index'])->name('collective-registrations.index');
    Route::get('/portal/{level}/lomba/{competition:slug}/daftar-kolektif', [CollectiveRegistrationController::class, 'create'])->name('collective-registrations.create');
    Route::get('/portal/{level}/lomba/{competition:slug}/template', [CollectiveRegistrationController::class, 'template'])->name('collective-registrations.template');
    Route::post('/portal/{level}/lomba/{competition:slug}/pratinjau', [CollectiveRegistrationController::class, 'preview'])->name('collective-registrations.preview');
    Route::post('/portal/{level}/lomba/{competition:slug}/kirim-kolektif', [CollectiveRegistrationController::class, 'commit'])->name('collective-registrations.commit');
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('competitions', CompetitionController::class);
    Route::post('competitions/{competition}/publish', [CompetitionController::class, 'publish'])->name('competitions.publish');
    Route::post('competitions/{competition}/archive', [CompetitionController::class, 'archive'])->name('competitions.archive');
    Route::post('competitions/{competition}/duplicate', [CompetitionController::class, 'duplicate'])->name('competitions.duplicate');

    Route::resource('bank-accounts', BankAccountController::class);

    // F07 — verifikasi pembayaran
    Route::get('pembayaran', [PaymentController::class, 'index'])->name('payments.index');
    Route::post('pembayaran/{invoice}/terima', [PaymentController::class, 'verify'])->name('payments.verify');
    Route::post('pembayaran/{invoice}/tolak', [PaymentController::class, 'reject'])->name('payments.reject');
    Route::post('pembayaran/{invoice}/perpanjang', [PaymentController::class, 'extend'])->name('payments.extend');
    Route::get('pembayaran/{invoice}/bukti', [InvoiceController::class, 'proof'])->name('payments.proof');

    Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');

    Route::resource('announcements', AnnouncementController::class);
    Route::post('announcements/{announcement}/publish', [AnnouncementController::class, 'publish'])->name('announcements.publish');
    Route::post('announcements/{announcement}/unpublish', [AnnouncementController::class, 'unpublish'])->name('announcements.unpublish');
});

require __DIR__.'/auth.php';

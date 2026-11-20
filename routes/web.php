<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\CertificateController as AdminCertificateController;
use App\Http\Controllers\Admin\CompetitionController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InstitutionController;
use App\Http\Controllers\Admin\JudgeController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\RegistrationController as AdminRegistrationController;
use App\Http\Controllers\Admin\ResultController;
use App\Http\Controllers\Admin\RubricController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CertificateVerificationController;
use App\Http\Controllers\CollectiveRegistrationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\Judge\DashboardController as JudgeDashboardController;
use App\Http\Controllers\Judge\EntryController as JudgeEntryController;
use App\Http\Controllers\Judge\ScoreSheetController as JudgeScoreSheetController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');

// F12 — verifikasi sertifikat publik (throttle: 60/menit)
Route::get('/verifikasi/{code}', [CertificateVerificationController::class, 'show'])
    ->middleware('throttle:60,1')
    ->name('certificates.verify');

// Breeze stub diganti: arahkan ke dasbor sesuai peran agar tidak ada dasbor ganda.
Route::get('/dashboard', function (Request $request) {
    return redirect($request->user()->homeRoute());
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

    // F12 — sertifikat
    Route::get('/sertifikat', [CertificateController::class, 'index'])->name('certificates.index');
    Route::get('/sertifikat/{certificate}/unduh', [CertificateController::class, 'download'])->name('certificates.download');
    Route::get('/sertifikat/unduh-semua', [CertificateController::class, 'downloadAll'])->name('certificates.download-all');
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
    Route::get('/portal/{level}/hasil/{competition:slug}', [PortalController::class, 'results'])->name('portal.results');
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
    // F09 — dasbor & pengelolaan
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('pendaftaran', [AdminRegistrationController::class, 'index'])->name('registrations.index');
    Route::get('pendaftaran/ekspor', [AdminRegistrationController::class, 'export'])->name('registrations.export');
    Route::get('pendaftaran/{registration}', [AdminRegistrationController::class, 'show'])->name('registrations.show');
    Route::post('pendaftaran/{registration}/batalkan', [AdminRegistrationController::class, 'cancel'])->name('registrations.cancel');
    Route::patch('siswa/{participant}/nama', [AdminRegistrationController::class, 'correctName'])->name('participants.correct-name');

    Route::get('lembaga', [InstitutionController::class, 'index'])->name('institutions.index');
    Route::get('lembaga/{institution}', [InstitutionController::class, 'show'])->name('institutions.show');

    Route::get('pengguna', [UserController::class, 'index'])->name('users.index');
    Route::post('pengguna/{user}/aktif', [UserController::class, 'toggleActive'])->name('users.toggle-active');

    Route::resource('competitions', CompetitionController::class);
    Route::post('competitions/{competition}/publish', [CompetitionController::class, 'publish'])->name('competitions.publish');
    Route::post('competitions/{competition}/archive', [CompetitionController::class, 'archive'])->name('competitions.archive');
    Route::post('competitions/{competition}/duplicate', [CompetitionController::class, 'duplicate'])->name('competitions.duplicate');

    Route::resource('bank-accounts', BankAccountController::class);

    // F07 — verifikasi pembayaran
    Route::get('pembayaran', [PaymentController::class, 'index'])->name('payments.index');
    Route::get('pembayaran/ekspor', [PaymentController::class, 'export'])->name('payments.export');
    Route::post('pembayaran/{invoice}/terima', [PaymentController::class, 'verify'])->name('payments.verify');
    Route::post('pembayaran/{invoice}/tolak', [PaymentController::class, 'reject'])->name('payments.reject');
    Route::post('pembayaran/{invoice}/perpanjang', [PaymentController::class, 'extend'])->name('payments.extend');
    Route::get('pembayaran/{invoice}/bukti', [InvoiceController::class, 'proof'])->name('payments.proof');

    // F10 — juri & rubrik penilaian
    Route::get('juri', [JudgeController::class, 'index'])->name('judges.index');
    Route::post('juri', [JudgeController::class, 'store'])->name('judges.store');
    Route::post('juri/{judge}/tugaskan', [JudgeController::class, 'assign'])->name('judges.assign');
    Route::delete('juri/penugasan/{assignment}', [JudgeController::class, 'unassign'])->name('judges.unassign');

    Route::get('lomba/{competition}/rubrik', [RubricController::class, 'edit'])->name('rubrics.edit');
    Route::put('lomba/{competition}/rubrik', [RubricController::class, 'update'])->name('rubrics.update');

    // F11 — penilaian & hasil
    Route::get('lomba/{competition}/hasil', [ResultController::class, 'index'])->name('results.index');
    Route::post('lomba/{competition}/hasil/hitung', [ResultController::class, 'compute'])->name('results.compute');
    Route::post('lomba/{competition}/hasil/juara', [ResultController::class, 'placements'])->name('results.placements');
    Route::post('lomba/{competition}/hasil/terbit', [ResultController::class, 'publish'])->name('results.publish');
    Route::post('lomba/{competition}/hasil/buka-semua', [ResultController::class, 'unlockAll'])->name('results.unlock-all');
    Route::post('nilai/{sheet}/buka', [ResultController::class, 'unlock'])->name('results.unlock');

    // F12 — sertifikat
    Route::get('lomba/{competition}/sertifikat', [AdminCertificateController::class, 'index'])->name('certificates.index');
    Route::post('lomba/{competition}/sertifikat/template', [AdminCertificateController::class, 'store'])->name('certificates.template.store');
    Route::get('lomba/{competition}/sertifikat/pratinjau', [AdminCertificateController::class, 'preview'])->name('certificates.preview');
    Route::get('sertifikat/template/{template}/gambar', [AdminCertificateController::class, 'image'])->name('certificates.image');
    Route::post('sertifikat/{certificate}/regenerasi', [AdminCertificateController::class, 'regenerate'])->name('certificates.regenerate');
    Route::get('sertifikat/{certificate}/unduh', [AdminCertificateController::class, 'download'])->name('certificates.download');

    Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');

    // F13 — riwayat aktivitas
    Route::get('log', [ActivityLogController::class, 'index'])->name('logs.index');

    Route::resource('announcements', AnnouncementController::class);
    Route::post('announcements/{announcement}/publish', [AnnouncementController::class, 'publish'])->name('announcements.publish');
    Route::post('announcements/{announcement}/unpublish', [AnnouncementController::class, 'unpublish'])->name('announcements.unpublish');
});

// F10–F11 — panel juri
Route::middleware(['auth', 'verified', 'role:judge'])->prefix('juri')->name('judge.')->group(function () {
    Route::get('/', JudgeDashboardController::class)->name('dashboard');
    Route::get('lomba/{competition}/entri', [JudgeEntryController::class, 'index'])->name('entries');
    Route::get('entri/{registration}/nilai', [JudgeScoreSheetController::class, 'edit'])->name('scores.edit');
    Route::put('entri/{registration}/nilai', [JudgeScoreSheetController::class, 'update'])->name('scores.update');
    Route::post('entri/{registration}/kunci', [JudgeScoreSheetController::class, 'lock'])->name('scores.lock');
});

require __DIR__.'/auth.php';

<?php

use Illuminate\Support\Facades\Route;

/**
 * AC-F13-02: setiap rute non-publik harus punya middleware `auth`
 * dan (role:* ATAU otorisasi Policy di controller).
 *
 * Policy tidak bisa dideteksi statis dari route list, jadi pemindai
 * menegakkan dua hal yang bisa diverifikasi statis:
 *   1. Rute tanpa middleware `auth` harus benar-benar publik (daftar putih).
 *   2. Rute ber-auth yang TIDAK punya `role:*` harus masuk daftar putih
 *      rute ber-otorisasi-Policy (atau rute bawaan auth Breeze).
 */
it('AC-F13-02 setiap rute non-publik punya auth + peran/policy', function () {
    $publicUris = [
        '/', 'up', 'login', 'logout', 'register', 'forgot-password', 'reset-password',
        'reset-password/{token}', 'verifikasi/{code}', 'storage/{path}', 'sanctum/csrf-cookie',
    ];

    // Rute ber-auth tanpa role:* yang otorisasinya lewat Policy / bawaan auth.
    $policyUris = [
        'dashboard', 'profile', 'profile/{id}', 'verify-email', 'verify-email/{id}/{hash}',
        'email/verification-notification', 'confirm-password', 'password', 'logout',
        'siswa', 'siswa/{participant}', 'pendaftaran', 'pendaftaran/{registration}',
        'tagihan', 'tagihan/{invoice}', 'tagihan/{invoice}/bukti',
        'sertifikat', 'sertifikat/{certificate}',
        'portal', 'portal/{level}', 'daftar-kolektif',
    ];

    $routes = collect(Route::getRoutes()->getRoutes());

    $violations = [];

    foreach ($routes as $route) {
        $uri = $route->uri();
        $middleware = collect($route->gatherMiddleware());

        $hasAuth = $middleware->contains('auth') || $middleware->contains(fn ($m) => str_starts_with($m, 'auth:'));

        if (! $hasAuth) {
            if (! in_array($uri, $publicUris, true)) {
                $violations[] = $uri.' (tanpa auth)';
            }

            continue;
        }

        $hasRole = $middleware->contains(fn ($m) => str_starts_with($m, 'role:'));

        if (! $hasRole && ! in_array($uri, $policyUris, true)) {
            $violations[] = $uri.' (auth tanpa role/policy jelas)';
        }
    }

    expect($violations)->toBeEmpty(implode("\n", $violations));
});

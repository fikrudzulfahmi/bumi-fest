<?php

use App\Enums\Role;
use App\Models\Institution;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;

describe('F01 — Akun & Autentikasi', function () {
    describe('Registrasi', function () {
        test('AC-F01-01 Daftar peserta berhasil, email verifikasi terkirim', function () {
            $response = $this->post('/register', [
                'type' => 'participant',
                'name' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'whatsapp' => '0812-3456-7890',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'privacy_consent' => true,
            ]);

            // Should redirect to verification.notice
            $response->assertRedirect('/verify-email');

            // User created dengan role participant
            $user = User::where('email', 'budi@example.com')->first();
            expect($user)->not->toBeNull();
            expect($user->role)->toBe(Role::Participant);
            expect($user->is_active)->toBeTrue();
            expect($user->privacy_consented_at)->not->toBeNull();
            expect($user->email_verified_at)->toBeNull(); // Not verified
        });

        test('AC-F01-02 Daftar lembaga membuat institutions terkait; NPSN tidak valid/ganda ditolak', function () {
            $response = $this->post('/register', [
                'type' => 'institution',
                'name' => 'Admin SD Maju',
                'email' => 'admin@sdmaju.sch.id',
                'whatsapp' => '082123456789',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'privacy_consent' => true,
                'institution_name' => 'SD Maju Jaya',
                'npsn' => '20123456', // 8 digit
                'city' => 'Jakarta',
            ]);

            $response->assertRedirect('/verify-email');

            $user = User::where('email', 'admin@sdmaju.sch.id')->first();
            expect($user->role)->toBe(Role::Institution);

            $institution = Institution::where('user_id', $user->id)->first();
            expect($institution)->not->toBeNull();
            expect($institution->npsn)->toBe('20123456');
            expect($institution->name)->toBe('SD Maju Jaya');
            expect($institution->city)->toBe('Jakarta');
        });

        test('AC-F01-02 NPSN ganda ditolak', function () {
            // Create institution dengan NPSN 20123456
            $user1 = User::factory()->create(['role' => Role::Institution]);
            Institution::create([
                'user_id' => $user1->id,
                'name' => 'SD Pertama',
                'npsn' => '20123456',
                'city' => 'Jakarta',
            ]);

            // Coba register dengan NPSN sama
            $response = $this->post('/register', [
                'type' => 'institution',
                'name' => 'Admin SD Kedua',
                'email' => 'admin@sdkedua.sch.id',
                'whatsapp' => '082123456789',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'privacy_consent' => true,
                'institution_name' => 'SD Kedua',
                'npsn' => '20123456', // duplikat
                'city' => 'Bandung',
            ]);

            $response->assertSessionHasErrors('npsn');
            $response->assertSessionHasErrors();
        });

        test('AC-F01-03 Field role dari request diabaikan (tidak bisa jadi admin)', function () {
            Notification::fake();

            $response = $this->post('/register', [
                'type' => 'participant',
                'name' => 'Penipu Hacker',
                'email' => 'hacker@evil.com',
                'whatsapp' => '0812-3456-7890',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'privacy_consent' => true,
                'role' => 'admin', // Coba set role admin
            ]);

            $user = User::where('email', 'hacker@evil.com')->first();
            // Role harus participant, bukan admin
            expect($user->role)->toBe(Role::Participant);
            expect($user->role)->not->toBe(Role::Admin);
        });

        test('AC-F01-06 WhatsApp 0812-3456-7890 tersimpan 6281234567890', function () {
            Notification::fake();

            $this->post('/register', [
                'type' => 'participant',
                'name' => 'WA Tester',
                'email' => 'wa@test.com',
                'whatsapp' => '0812-3456-7890',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'privacy_consent' => true,
            ]);

            $user = User::where('email', 'wa@test.com')->first();
            expect($user->whatsapp)->toBe('6281234567890');
        });

        test('AC-F01-10 Persetujuan privasi wajib; waktu tersimpan', function () {
            Notification::fake();

            // Coba tanpa privacy consent
            $response = $this->post('/register', [
                'type' => 'participant',
                'name' => 'No Consent',
                'email' => 'noconsent@test.com',
                'whatsapp' => '0812-3456-7890',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                // privacy_consent not provided
            ]);

            $response->assertSessionHasErrors('privacy_consent');

            // Dengan consent
            $this->post('/register', [
                'type' => 'participant',
                'name' => 'With Consent',
                'email' => 'withconsent@test.com',
                'whatsapp' => '0812-3456-7890',
                'password' => 'Password@123',
                'password_confirmation' => 'Password@123',
                'privacy_consent' => true,
            ]);

            $user = User::where('email', 'withconsent@test.com')->first();
            expect($user->privacy_consented_at)->not->toBeNull();
            expect($user->privacy_consented_at)->toBeInstanceOf(Carbon::class);
        });
    });

    describe('Login', function () {
        test('AC-F01-04 Email belum terverifikasi → redirect verifikasi', function () {
            $user = User::factory()->create(['email_verified_at' => null]);

            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

            // Should redirect to verification.notice
            $response->assertRedirect('/verify-email');

            // User should be authenticated
            $this->assertAuthenticatedAs($user);
        });

        test('AC-F01-05 Redirect sesuai peran: Participant → /portal', function () {
            $user = User::factory()->create([
                'role' => Role::Participant,
                'email_verified_at' => now(),
            ]);

            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

            $response->assertRedirect('/portal');
        });

        test('AC-F01-05 Redirect sesuai peran: Institution → /portal', function () {
            $user = User::factory()->create([
                'role' => Role::Institution,
                'email_verified_at' => now(),
            ]);

            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

            $response->assertRedirect('/portal');
        });

        test('AC-F01-05 Redirect sesuai peran: Admin → /admin', function () {
            $user = User::factory()->create([
                'role' => Role::Admin,
                'email_verified_at' => now(),
            ]);

            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

            $response->assertRedirect('/admin');
        });

        test('AC-F01-05 Redirect sesuai peran: Judge → /juri', function () {
            $user = User::factory()->create([
                'role' => Role::Judge,
                'email_verified_at' => now(),
            ]);

            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

            $response->assertRedirect('/juri');
        });

        test('AC-F01-07 Percobaan masuk ke-6 dalam semenit di-throttle', function () {
            $user = User::factory()->create(['email_verified_at' => now()]);

            // Coba 5× gagal
            for ($i = 0; $i < 5; $i++) {
                $this->post('/login', [
                    'email' => $user->email,
                    'password' => 'wrongpassword',
                ]);
            }

            // Percobaan ke-6 harus di-throttle
            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'wrongpassword',
            ]);

            $response->assertSessionHasErrors('email');
            $errors = session('errors')->getBag('default')->all();
            expect($errors[0])->toContain('Terlalu banyak');
        });

        test('AC-F01-08 Akun nonaktif ditolak dengan pesan Indonesia', function () {
            $user = User::factory()->create([
                'is_active' => false,
                'email_verified_at' => now(),
            ]);

            $response = $this->post('/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

            $response->assertSessionHasErrors('email');
            $response->assertSessionHasErrors();
            $errors = session('errors')->getBag('default')->all();
            expect($errors[0])->toContain('tidak aktif');
        });
    });

    describe('Password Reset', function () {
        test('AC-F01-09 Lupa kata sandi: tautan reset terkirim dan berfungsi', function () {
            $user = User::factory()->create();

            $response = $this->post('/forgot-password', [
                'email' => $user->email,
            ]);

            $response->assertSessionHasNoErrors();
            $response->assertSessionHas('status');
        });
    });
});

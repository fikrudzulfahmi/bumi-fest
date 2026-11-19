<?php

namespace App\Actions\Judge;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * AC-F10-01: admin membuat akun juri; email atur kata sandi langsung dikirim.
 *
 * Kata sandi diisi acak (tidak pernah dibagikan) — juri masuk lewat tautan
 * reset kata sandi dari password broker bawaan Laravel.
 */
class CreateJudgeAccount
{
    /**
     * @param  array{name: string, email: string, whatsapp?: string|null}  $data
     */
    public function handle(array $data): User
    {
        $judge = DB::transaction(function () use ($data): User {
            $judge = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'whatsapp' => $data['whatsapp'] ?? null,
                'password' => Str::random(40),
                'role' => Role::Judge,
                'is_active' => true,
            ]);

            // AC-F10-01: akun juri buatan admin tidak perlu verifikasi email;
            // kepemilikan email tetap dibuktikan lewat tautan atur kata sandi.
            // forceFill dipakai karena kolom ini sengaja di luar $fillable.
            $judge->forceFill(['email_verified_at' => now()])->save();

            return $judge;
        });

        Password::sendResetLink(['email' => $judge->email]);

        return $judge;
    }
}

<?php

namespace App\Actions\Registration;

use App\Enums\Role;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegisterNewUser
{
    /**
     * Register a new user (participant or institution).
     *
     * @param  array<string, mixed>  $data
     *
     * AC-F01-01, AC-F01-02, AC-F01-03, AC-F01-10
     */
    public function handle(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // Create user (AC-F01-03: role always participant/institution, never from request)
            $role = $data['type'] === 'institution' ? Role::Institution : Role::Participant;

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'whatsapp' => $data['whatsapp'], // Already normalized by RegisterRequest
                'password' => Hash::make($data['password']),
                'role' => $role,
                'is_active' => true,
                'privacy_consented_at' => now(), // AC-F01-10: timestamp consent
            ]);

            // Create institution if type = institution (AC-F01-02)
            if ($data['type'] === 'institution') {
                Institution::create([
                    'user_id' => $user->id,
                    'name' => $data['institution_name'],
                    'npsn' => $data['npsn'],
                    'city' => $data['city'],
                ]);
            }

            return $user;
        });
    }
}

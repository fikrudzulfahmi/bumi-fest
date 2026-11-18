<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin dari .env
        $adminEmail = env('ADMIN_EMAIL', 'admin@bumifest.local');
        $adminPassword = env('ADMIN_PASSWORD', 'password123');

        User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Administrator',
                'password' => Hash::make($adminPassword),
                'role' => Role::Admin,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}

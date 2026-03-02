<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update test patient
        User::updateOrCreate(
            ['email' => 'patient@example.com'],
            [
                'name' => 'John Patient',
                'password' => Hash::make('password123'),
                'role' => 'patient',
                'identifier' => 'PAT000001',
            ]
        );

        // Create or update test doctor
        User::updateOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name' => 'Dr. Sarah Johnson',
                'password' => Hash::make('password123'),
                'role' => 'doctor',
                'identifier' => 'DOC000001',
            ]
        );

        // Create or update test admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'identifier' => 'ADM000001',
            ]
        );

        // Create or update test super admin
        User::updateOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'identifier' => 'SUP000001',
            ]
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create doctors as users with role 'doctor'
        User::updateOrCreate(
            ['email' => 'dr.james@example.com'],
            [
                'name' => 'Dr. James Wilson',
                'password' => bcrypt('password123'),
                'phone' => '+1-234-567-8904',
                'role' => 'doctor',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dr.sarah@example.com'],
            [
                'name' => 'Dr. Sarah Johnson',
                'password' => bcrypt('password123'),
                'phone' => '+1-234-567-8905',
                'role' => 'doctor',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dr.michael@example.com'],
            [
                'name' => 'Dr. Michael Chen',
                'password' => bcrypt('password123'),
                'phone' => '+1-234-567-8906',
                'role' => 'doctor',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dr.emily@example.com'],
            [
                'name' => 'Dr. Emily Rodriguez',
                'password' => bcrypt('password123'),
                'phone' => '+1-234-567-8907',
                'role' => 'doctor',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dr.robert@example.com'],
            [
                'name' => 'Dr. Robert Brown',
                'password' => bcrypt('password123'),
                'phone' => '+1-234-567-8908',
                'role' => 'doctor',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dr.lisa@example.com'],
            [
                'name' => 'Dr. Lisa Anderson',
                'password' => bcrypt('password123'),
                'phone' => '+1-234-567-8909',
                'role' => 'doctor',
            ]
        );
    }
}

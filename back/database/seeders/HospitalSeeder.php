<?php

namespace Database\Seeders;

use App\Models\Hospital;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HospitalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Hospital::updateOrCreate(
            ['slug' => 'city-medical-hospital'],
            [
                'name' => 'City Medical Hospital',
                'address' => '123 Main Street, Downtown',
            ]
        );

        Hospital::updateOrCreate(
            ['slug' => 'green-valley-medical-center'],
            [
                'name' => 'Green Valley Medical Center',
                'address' => '456 Oak Avenue, Valley District',
            ]
        );

        Hospital::updateOrCreate(
            ['slug' => 'sunrise-healthcare-hospital'],
            [
                'name' => 'Sunrise Healthcare Hospital',
                'address' => '789 Sunset Boulevard, West Side',
            ]
        );

        Hospital::updateOrCreate(
            ['slug' => 'blue-cross-medical-clinic'],
            [
                'name' => 'Blue Cross Medical Clinic',
                'address' => '321 Health Lane, Medical District',
            ]
        );
    }
}

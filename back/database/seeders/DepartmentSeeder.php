<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Hospital;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DepartmentSeeder extends Seeder
{
    /**
     * Standard hospital departments
     */
    protected array $standardDepartments = [
        [
            'name' => 'Emergency Department (ED)',
            'description' => 'Also called Casualty. Handles urgent and life-threatening cases (accidents, heart attacks, injuries)',
        ],
        [
            'name' => 'Outpatient Department (OPD)',
            'description' => 'For patients who visit for consultation and go home the same day. Includes general physician and specialist clinics',
        ],
        [
            'name' => 'Inpatient Department (IPD)',
            'description' => 'For patients who need admission and overnight stay. Includes general wards, private rooms, ICU',
        ],
        [
            'name' => 'Cardiology Department',
            'description' => 'Heart-related problems (ECG, heart disease, blood pressure). Cardiologists treat heart conditions',
        ],
        [
            'name' => 'Neurology Department',
            'description' => 'Brain and nervous system disorders (stroke, epilepsy)',
        ],
        [
            'name' => 'Orthopedics Department',
            'description' => 'Bones, joints, fractures, spine issues',
        ],
        [
            'name' => 'Laboratory / Pathology',
            'description' => 'Blood tests, urine tests, biopsy reports',
        ],
        [
            'name' => 'Radiology Department',
            'description' => 'X-ray, CT scan, MRI, ultrasound',
        ],
        [
            'name' => 'Pediatrics Department',
            'description' => 'Child healthcare',
        ],
        [
            'name' => 'Gynecology & Obstetrics',
            'description' => 'Women\'s health, pregnancy, childbirth',
        ],
        [
            'name' => 'Surgery Department',
            'description' => 'General surgery and specialized surgeries',
        ],
        [
            'name' => 'Pharmacy',
            'description' => 'Medicine distribution and management',
        ],
        [
            'name' => 'Nursing Department',
            'description' => 'Patient care and monitoring',
        ],
        [
            'name' => 'Intensive Care Unit (ICU)',
            'description' => 'Critical patients needing close monitoring',
        ],
        [
            'name' => 'Dental Department',
            'description' => 'Oral and dental treatments',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $hospitals = Hospital::all();

        foreach ($hospitals as $hospital) {
            foreach ($this->standardDepartments as $dept) {
                $slug = Str::slug($dept['name'] . '-' . $hospital->id);
                
                Department::updateOrCreate(
                    [
                        'hospital_id' => $hospital->id,
                        'slug' => $slug,
                    ],
                    [
                        'name' => $dept['name'],
                        'description' => $dept['description'],
                        'status' => 'active',
                        'total_beds' => 0,
                        'available_beds' => 0,
                    ]
                );
            }
        }

        $this->command->info('Standard departments created for ' . $hospitals->count() . ' hospitals.');
    }
}

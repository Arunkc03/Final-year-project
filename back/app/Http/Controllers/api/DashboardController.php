<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Hospital;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function superAdminDashboard()
    {
        $user = auth()->user();

        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $activeHospitalIds = Hospital::query()->pluck('id');

        $validStaffUsers = User::query()
            ->whereIn('role', ['doctor', 'admin'])
            ->whereIn('hospital_id', $activeHospitalIds);

        $standaloneUsers = User::query()
            ->whereIn('role', ['patient', 'super_admin']);

        return response()->json([
            'status' => 'success',
            'message' => 'Super Admin Dashboard',
            'user' => $user,
            'data' => [
                'total_hospitals' => $activeHospitalIds->count(),
                'total_users' => (clone $standaloneUsers)->count() + (clone $validStaffUsers)->count(),
                'total_doctors' => (clone $validStaffUsers)->where('role', 'doctor')->count(),
                'total_patients' => User::query()->where('role', 'patient')->count(),
                'total_admins' => (clone $validStaffUsers)->where('role', 'admin')->count(),
            ],
        ]);
    }

    public function adminDashboard()
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $hospitalId = $user->hospital_id;

        return response()->json([
            'status' => 'success',
            'message' => 'Admin Dashboard',
            'user' => $user,
            'data' => [
                'hospital_id' => $hospitalId,
                'total_doctors' => \App\Models\User::where('hospital_id', $hospitalId)->where('role', 'doctor')->count(),
                'total_patients' => \App\Models\User::where('hospital_id', $hospitalId)->where('role', 'patient')->count(),
                'total_users' => \App\Models\User::where('hospital_id', $hospitalId)->count(),
                // Hospital activity
                'total_appointments' => \App\Models\Appointment::where('hospital_id', $hospitalId)->count(),
                'pending_appointments' => \App\Models\Appointment::where('hospital_id', $hospitalId)->where('status', 'pending')->count(),
                'total_reports' => \App\Models\Report::where('hospital_id', $hospitalId)->count(),
            ],
        ]);
    }

    public function doctorDashboard()
    {
        $user = auth()->user();

        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $doctor = Doctor::with(['department', 'hospital'])
            ->where('user_id', $user->id)
            ->first();

        return response()->json([
            'status' => 'success',
            'message' => 'Doctor Dashboard',
            'user' => $user,
            'data' => [
                'doctor_id' => $user->id,
                'hospital_id' => $user->hospital_id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'license_number' => $doctor?->license_number,
                'specialization' => $doctor?->specialization,
                'qualification' => $doctor?->qualification,
                'experience_years' => $doctor?->experience_years,
                'consultation_fee' => $doctor?->consultation_fee,
                'bio' => $doctor?->bio,
                'department_id' => $doctor?->department_id,
                'department_name' => $doctor?->department?->name,
                'image' => $doctor?->image,
                'is_active' => $doctor?->is_active,
            ],
        ]);
    }

    public function patientDashboard()
    {
        $user = auth()->user();

        if (!$user->isPatient()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Patient Dashboard',
            'user' => $user,
            'data' => [
                'patient_id' => $user->id,
                'hospital_id' => $user->hospital_id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}

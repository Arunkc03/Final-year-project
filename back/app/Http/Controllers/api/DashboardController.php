<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function superAdminDashboard()
    {
        $user = auth()->user();

        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Super Admin Dashboard',
            'user' => $user,
            'data' => [
                'total_hospitals' => \App\Models\Hospital::count(),
                'total_users' => \App\Models\User::count(),
                'total_doctors' => \App\Models\User::where('role', 'doctor')->count(),
                'total_patients' => \App\Models\User::where('role', 'patient')->count(),
                'total_admins' => \App\Models\User::where('role', 'admin')->count(),
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

        return response()->json([
            'status' => 'success',
            'message' => 'Doctor Dashboard',
            'user' => $user,
            'data' => [
                'doctor_id' => $user->id,
                'hospital_id' => $user->hospital_id,
                'name' => $user->name,
                'email' => $user->email,
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

<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Doctor;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DoctorController extends Controller
{
    // Admin index - List doctors for admin dashboard
    public function adminIndex(Request $request)
    {
        $user = auth()->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $query = Doctor::with('user', 'hospital', 'department');
        
        if ($user->isAdmin()) {
            $query->where('hospital_id', $user->hospital_id);
        }

        $doctors = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json(['status'=>'success','data'=>$doctors]);
    }

    // List doctors. If unauthenticated, return public list; otherwise admin/super-admin behavior
    public function index(Request $request)
    {
        $user = auth()->user();

        if (!$user) {
            // public list for patients
            $query = Doctor::with('user', 'hospital', 'department')
                ->where('is_active', true);
            
            // Filter by department if provided
            if ($request->has('department_id')) {
                $query->where('department_id', $request->department_id);
            }
            
            // Filter by hospital if provided
            if ($request->has('hospital_id')) {
                $query->where('hospital_id', $request->hospital_id);
            }
            
            $doctors = $query->orderBy('created_at', 'desc')->get();
            return response()->json(['status' => 'success', 'data' => $doctors]);
        }

        if ($user->isSuperAdmin()) {
            $doctors = Doctor::with('user', 'hospital', 'department')
                ->orderBy('created_at', 'desc')
                ->get();
        } elseif ($user->isAdmin()) {
            $doctors = Doctor::with('user', 'hospital', 'department')
                ->where('hospital_id', $user->hospital_id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        return response()->json(['status'=>'success','data'=>$doctors]);
    }

    // Create doctor
    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user || !$user->isAdmin()) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        // Check if admin has hospital_id
        if (!$user->hospital_id) {
            return response()->json([
                'status'=>'error',
                'message'=>'Admin user must be associated with a hospital to create doctors'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'department_id' => 'nullable|exists:departments,id',
            'license_number' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'qualification' => 'nullable|string|max:255',
            'experience_years' => 'nullable|integer|min:0',
            'consultation_fee' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
            'daily_patient_limit' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        try {
            // Create user account first
            $doctorUser = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'doctor',
                'hospital_id' => $user->hospital_id,
                'identifier' => 'DOC'.Str::upper(Str::random(6)),
            ]);

            // Create doctor profile
            $doctor = Doctor::create([
                'user_id' => $doctorUser->id,
                'hospital_id' => $user->hospital_id,
                'department_id' => $request->department_id,
                'license_number' => $request->license_number,
                'specialization' => $request->specialization,
                'qualification' => $request->qualification,
                'experience_years' => $request->experience_years ?? 0,
                'consultation_fee' => $request->consultation_fee ?? 0,
                'bio' => $request->bio,
                'daily_patient_limit' => $request->daily_patient_limit ?? 20,
                'is_active' => true,
            ]);

            return response()->json([
                'status'=>'success',
                'message'=>'Doctor created successfully',
                'doctor'=>$doctor->load('user', 'hospital', 'department')
            ], 201);
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Doctor creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'admin_id' => $user->id,
                'hospital_id' => $user->hospital_id
            ]);
            
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to create doctor: '.$e->getMessage()
            ], 500);
        }
    }

    // Show a single doctor
    public function show($id)
    {
        $user = auth()->user();
        $doctor = Doctor::with('user', 'hospital', 'department')->findOrFail($id);

        // Allow public access (unauthenticated) or patients to view doctor details
        if (!$user || $user->role === 'patient') {
            return response()->json([
                'status' => 'success',
                'data' => $doctor
            ]);
        }

        if ($user->isSuperAdmin()) {
            // ok
        } elseif ($user->isAdmin() && $user->hospital_id == $doctor->hospital_id) {
            // ok
        } elseif ($user->role === 'doctor' && $user->id === $doctor->user_id) {
            // Doctor viewing their own profile - ok
        } else {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        return response()->json(['status'=>'success','data'=>$doctor]);
    }

    // Update doctor
    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $doctor = Doctor::findOrFail($id);

        if (!($user->isSuperAdmin() || ($user->isAdmin() && $user->hospital_id == $doctor->hospital_id))) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$doctor->user_id,
            'phone' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'license_number' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'qualification' => 'nullable|string|max:255',
            'experience_years' => 'nullable|integer|min:0',
            'consultation_fee' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
            'daily_patient_limit' => 'nullable|integer|min:1|max:100',
            'password' => 'nullable|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        try {
            // Update user data
            $userData = $request->only(['name', 'email', 'phone']);
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $doctor->user->update($userData);

            // Update doctor profile
            $doctorData = $request->only(['department_id', 'license_number', 'specialization', 'qualification', 'experience_years', 'consultation_fee', 'bio', 'daily_patient_limit']);
            $doctor->update($doctorData);

            return response()->json([
                'status'=>'success',
                'message'=>'Doctor updated successfully',
                'doctor'=>$doctor->fresh()->load('user', 'hospital', 'department')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to update doctor: '.$e->getMessage()
            ], 500);
        }
    }

    // Delete doctor
    public function destroy($id)
    {
        $user = auth()->user();
        $doctor = Doctor::findOrFail($id);

        if (!($user->isSuperAdmin() || ($user->isAdmin() && $user->hospital_id == $doctor->hospital_id))) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        try {
            // Delete the associated user account
            $doctor->user->delete();
            // Doctor will be cascaded deleted
            
            return response()->json(['status'=>'success','message'=>'Doctor deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to delete doctor: '.$e->getMessage()
            ], 500);
        }
    }

    // Toggle doctor active status
    public function toggleStatus($id)
    {
        $user = auth()->user();
        $doctor = Doctor::findOrFail($id);

        if (!($user->isSuperAdmin() || ($user->isAdmin() && $user->hospital_id == $doctor->hospital_id))) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $doctor->is_active = !$doctor->is_active;
        $doctor->save();

        return response()->json([
            'status'=>'success',
            'message'=>'Doctor status updated',
            'doctor'=>$doctor->load('user', 'hospital', 'department')
        ]);
    }
}

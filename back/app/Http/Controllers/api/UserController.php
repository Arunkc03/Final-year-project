<?php


namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;


class UserController extends Controller
{
    // Patient Self-Registration (public)
    public function registerPatient(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'patient',
            'hospital_id' => null,
            'identifier' => 'PAT'.Str::upper(Str::random(6)),
        ]);

        return response()->json([
            'status'=>'success',
            'message'=>'Patient registration successful',
            'user'=>$user
        ], 201);
    }

    // Note: Admins are created when Super Admin creates a Hospital (see HospitalController)

    // Doctor Creation (only Admin or Super Admin)
    public function createDoctor(Request $request)
    {
        $creator = auth()->user();

        if (!$creator || (!$creator->isAdmin())) {
            return response()->json(['message' => 'Unauthorized: Only Admin can create doctors'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        // Doctor gets assigned to the same hospital as the admin
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'doctor',
            'hospital_id' => $creator->hospital_id,
            'identifier' => 'DOC'.Str::upper(Str::random(6)),
        ]);

        return response()->json([
            'status'=>'success',
            'message'=>'Doctor created successfully',
            'user'=>$user
        ], 201);
    }

    // Keep old register for backward compatibility (calls patient register)
    public function register(Request $request)
    {
        return $this->registerPatient($request);
    }

    // Login user
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required_without:identifier|email',
            'identifier' => 'required_without:email|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        // Allow login by identifier or email
        if ($request->filled('identifier')) {
            $user = User::where('identifier', $request->identifier)->first();
        } else {
            $user = User::where('email', $request->email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['status'=>'error','message'=>'Invalid credentials'], 401);
        }

        // Generate Sanctum token
        $token = $user->createToken('api-token')->plainTextToken;

        $dashboardRoute = null;
        if ($user->isSuperAdmin()) {
            $dashboardRoute = '/dashboard/super-admin';
        } elseif ($user->isAdmin()) {
            $dashboardRoute = '/dashboard/admin';
        } elseif ($user->isDoctor()) {
            $dashboardRoute = '/dashboard/doctor';
        } elseif ($user->isPatient()) {
            // Patients don't have a dedicated dashboard in the frontend.
            // Redirect them to the public home page where they can
            // view hospitals/doctors and book appointments.
            $dashboardRoute = '/';
        }

        $response = [
            'status' => 'success',
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
            'dashboard' => $dashboardRoute,
        ];

        // include hospital info for admin/doctor/patient if available
        if ($user->hospital) {
            $response['hospital'] = [
                'id' => $user->hospital->id,
                'name' => $user->hospital->name ?? null,
                'email' => $user->hospital->email ?? null,
            ];
        }

        return response()->json($response);
    }

    // Logout current token
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json(['status' => 'success', 'message' => 'Logged out']);
    }

    // Update user profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date',
            'gender' => 'sometimes|nullable|in:male,female,other',
            'address' => 'sometimes|nullable|string|max:500',
            'city' => 'sometimes|nullable|string|max:100',
            'state' => 'sometimes|nullable|string|max:100',
            'postal_code' => 'sometimes|nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        // Update only provided fields
        $fillable = ['name', 'phone', 'date_of_birth', 'gender', 'address', 'city', 'state', 'postal_code'];
        
        foreach ($fillable as $field) {
            if ($request->has($field)) {
                $user->$field = $request->input($field);
            }
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}
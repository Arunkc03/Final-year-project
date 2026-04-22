<?php


namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;


class UserController extends Controller
{
    private function forgotPasswordMessage(string $status): string
    {
        return match ($status) {
            Password::RESET_LINK_SENT => 'If this email is registered, a password reset link has been sent.',
            Password::RESET_THROTTLED => 'Please wait before requesting another reset link.',
            default => 'If this email is registered, a password reset link has been sent.',
        };
    }

    private function resetPasswordMessage(string $status): string
    {
        return match ($status) {
            Password::PASSWORD_RESET => 'Password has been reset successfully.',
            Password::INVALID_TOKEN => 'This reset link is invalid or expired. Please request a new one.',
            Password::INVALID_USER => 'No account found for this email address.',
            Password::RESET_THROTTLED => 'Too many attempts. Please wait and try again.',
            default => 'Unable to reset password. Please request a new reset link and try again.',
        };
    }

    // Set password for authenticated account (used by Google sign-up onboarding)
    public function setPassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password set successfully',
        ]);
    }

    // Send password reset link
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'status' => 'success',
                'message' => $this->forgotPasswordMessage($status),
            ]);
        }

        // Return success for unknown email to avoid account enumeration and reduce mismatch confusion.
        if ($status === Password::INVALID_USER) {
            return response()->json([
                'status' => 'success',
                'message' => $this->forgotPasswordMessage($status),
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $this->forgotPasswordMessage($status),
        ], 422);
    }

    // Reset password using token sent by email
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'status' => 'success',
                'message' => $this->resetPasswordMessage($status),
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $this->resetPasswordMessage($status),
        ], 422);
    }

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

        $user->loadMissing('hospital');

        if (!$user->hasAccessibleHospital()) {
            $user->tokens()->delete();

            return response()->json([
                'status' => 'error',
                'message' => 'Your hospital account is no longer available.',
            ], 403);
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

    // List all users (admin/super_admin) — filter by role if ?role= given
    public function adminUsers(Request $request)
    {
        $query = User::with('hospital:id,name')->orderBy('created_at', 'desc');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->paginate(50);

        return response()->json(['status' => 'success', 'data' => $users]);
    }

    // System-level user list (super_admin only)
    public function systemUsers(Request $request)
    {
        return $this->adminUsers($request);
    }

    // Show single user
    public function show($id)
    {
        $user = User::with('hospital:id,name')->find($id);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $user]);
    }

    // Admin update user
    public function adminUpdate(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role'  => 'sometimes|in:patient,doctor,admin,super_admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user->fill($request->only(['name', 'email', 'role']))->save();

        return response()->json(['status' => 'success', 'message' => 'User updated', 'data' => $user]);
    }

    // Delete (permanently remove) a user account
    public function destroy($id)
    {
        $caller = auth()->user();
        $user = User::find($id);

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        // Prevent deleting yourself or other super admins
        if ($user->id === $caller->id) {
            return response()->json(['status' => 'error', 'message' => 'Cannot delete your own account'], 403);
        }

        if ($user->isSuperAdmin()) {
            return response()->json(['status' => 'error', 'message' => 'Cannot delete a super admin'], 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['status' => 'success', 'message' => 'User account removed']);
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
            'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar && \Storage::disk('public')->exists($user->avatar)) {
                \Storage::disk('public')->delete($user->avatar);
            }
            
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $avatarPath;
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
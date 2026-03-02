<?php

namespace App\Http\Controllers\api;

use App\Models\User;
use App\Models\Hospital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * AdminController
 * Handles admin management operations
 * Use Cases: Manage admin accounts, Manage doctors, Manage departments
 */
class AdminController extends Controller
{
    /**
     * Get all admins
     * GET /api/admins
     * Accessible: Super Admin
     */
    public function index(Request $request)
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $query = User::admins()->with('hospital');

        // Filter by hospital
        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $admins = $query->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $admins,
        ]);
    }

    /**
     * Get single admin
     * GET /api/admins/{id}
     */
    public function show($id)
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $admin = User::where('id', $id)->whereIn('role', ['admin', 'super_admin'])->with('hospital')->first();

        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $admin,
        ]);
    }

    /**
     * Create admin account
     * POST /api/admins
     * Accessible: Super Admin
     */
    public function store(Request $request)
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'hospital_id' => 'required|exists:hospitals,id',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,super_admin',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'hospital_id' => $validated['hospital_id'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        // Log action
        \App\Models\AuditLog::log('create', $admin, $admin->id, null, $validated, 'Admin account created');

        return response()->json([
            'status' => 'success',
            'data' => $admin,
            'message' => 'Admin account created successfully',
        ], 201);
    }

    /**
     * Update admin
     * PUT /api/admins/{id}
     */
    public function update(Request $request, $id)
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $admin = User::where('id', $id)->whereIn('role', ['admin', 'super_admin'])->first();

        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin not found',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'hospital_id' => 'sometimes|exists:hospitals,id',
            'is_active' => 'sometimes|boolean',
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        $oldValues = $admin->getAttributes();

        if ($request->has('password')) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $admin->update($validated);

        // Log action
        \App\Models\AuditLog::log('update', $admin, $admin->id, $oldValues, $validated, 'Admin account updated');

        return response()->json([
            'status' => 'success',
            'data' => $admin,
            'message' => 'Admin updated successfully',
        ]);
    }

    /**
     * Delete admin
     * DELETE /api/admins/{id}
     */
    public function destroy($id)
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $admin = User::where('id', $id)->whereIn('role', ['admin', 'super_admin'])->first();

        if (!$admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Admin not found',
            ], 404);
        }

        // Prevent deleting yourself
        if ($admin->id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete your own admin account',
            ], 422);
        }

        // Log action
        \App\Models\AuditLog::log('delete', $admin, $admin->id, $admin->getAttributes(), null, 'Admin account deleted');

        $admin->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Admin deleted successfully',
        ]);
    }

    /**
     * View system logs
     * GET /api/system/logs
     */
    public function logs(Request $request)
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $query = \App\Models\AuditLog::with('user');

        // Filter by model
        if ($request->has('model')) {
            $query->where('model', $request->model);
        }

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date),
                \Carbon\Carbon::parse($request->end_date)
            ]);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }

    /**
     * View system settings
     * GET /api/system/settings
     */
    public function settings()
    {
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $settings = [
            'total_users' => User::count(),
            'total_doctors' => User::doctors()->count(),
            'total_patients' => User::patients()->count(),
            'total_hospitals' => Hospital::count(),
            'total_appointments' => \App\Models\Appointment::count(),
            'total_departments' => \App\Models\Department::count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $settings,
        ]);
    }
}

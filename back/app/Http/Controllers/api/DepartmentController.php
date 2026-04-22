<?php

namespace App\Http\Controllers\api;

use App\Models\Department;
use App\Models\Hospital;
use Illuminate\Http\Request;

/**
 * DepartmentController
 * Handles all department-related operations
 * Use Cases: View departments, Manage departments (Admin)
 */
class DepartmentController extends Controller
{
    /**
     * Get all departments
     * GET /api/departments
     * Accessible: Patient (public), Doctor, Admin, Super Admin
     */
    public function index(Request $request)
    {
        $query = Department::with(['hospital', 'doctors.user', 'schedules']);

        // Filter by hospital if specified
        if ($request->has('hospital_id')) {
            $query->where('hospital_id', $request->hospital_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $departments = $query->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $departments,
            'message' => 'Departments retrieved successfully',
        ]);
    }

    /**
     * Get single department with details
     * GET /api/departments/{id}
     * Accessible: Patient, Doctor, Admin, Super Admin
     */
    public function show($id)
    {
        $department = Department::with([
            'hospital',
            'doctors' => function ($query) {
                $query->where('is_active', true);
            },
            'schedules' => function ($query) {
                $query->where('status', 'available');
            }
        ])->find($id);

        if (!$department) {
            return response()->json([
                'status' => 'error',
                'message' => 'Department not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $department,
            'message' => 'Department retrieved successfully',
        ]);
    }

    /**
     * Create new department
     * POST /api/departments
     * Accessible: Admin, Super Admin
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'hospital_id' => 'required|exists:hospitals,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'head_doctor' => 'nullable|string|max:255',
            'total_beds' => 'nullable|integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        // Generate unique slug
        $slug = \Illuminate\Support\Str::slug($validated['name']);
        $originalSlug = $slug;
        $counter = 1;
        
        while (Department::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }
        
        $validated['slug'] = $slug;

        $department = Department::create($validated);

        // Log action
        \App\Models\AuditLog::log('create', $department, $department->id, null, $validated, 'Department created');

        return response()->json([
            'status' => 'success',
            'data' => $department,
            'message' => 'Department created successfully',
        ], 201);
    }

    /**
     * Update department
     * PUT /api/departments/{id}
     * Accessible: Admin, Super Admin
     */
    public function update(Request $request, $id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json([
                'status' => 'error',
                'message' => 'Department not found',
            ], 404);
        }

        // Check authorization
        if (auth()->user()->role === 'admin' && auth()->user()->hospital_id !== $department->hospital_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'head_doctor' => 'nullable|string|max:255',
            'total_beds' => 'nullable|integer|min:0',
            'available_beds' => 'nullable|integer|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $oldValues = $department->getAttributes();
        $department->update($validated);

        // Log action
        \App\Models\AuditLog::log('update', $department, $department->id, $oldValues, $validated, 'Department updated');

        return response()->json([
            'status' => 'success',
            'data' => $department,
            'message' => 'Department updated successfully',
        ]);
    }

    /**
     * Delete department
     * DELETE /api/departments/{id}
     * Accessible: Admin, Super Admin
     */
    public function destroy($id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json([
                'status' => 'error',
                'message' => 'Department not found',
            ], 404);
        }

        // Check authorization: admin can delete only departments in their own hospital.
        if (auth()->user()->role === 'admin' && auth()->user()->hospital_id !== $department->hospital_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        // Prevent deleting department with assigned doctors to avoid orphaned assignments.
        if ($department->doctors()->count() > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete department with assigned doctors. Move or delete doctors first.',
            ], 422);
        }

        // Log action
        \App\Models\AuditLog::log('delete', $department, $department->id, $department->getAttributes(), null, 'Department deleted');

        $department->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Department deleted successfully',
        ]);
    }

    /**
     * Get department statistics
     * GET /api/departments/{id}/statistics
     * Accessible: Admin, Super Admin
     */
    public function statistics($id)
    {
        $department = Department::find($id);

        if (!$department) {
            return response()->json([
                'status' => 'error',
                'message' => 'Department not found',
            ], 404);
        }

        $stats = [
            'total_doctors' => $department->doctors()->count(),
            'total_beds' => $department->total_beds,
            'available_beds' => $department->available_beds,
            'total_appointments' => $department->appointments()->count(),
            'pending_appointments' => $department->appointments()->pending()->count(),
            'completed_appointments' => $department->appointments()->completed()->count(),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats,
            'message' => 'Department statistics retrieved successfully',
        ]);
    }
}

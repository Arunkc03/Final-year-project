<?php

namespace App\Http\Controllers\api;

use App\Models\DoctorSchedule;
use App\Models\Department;
use App\Models\Appointment;
use App\Mail\ScheduleCancelledByDoctor;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * DoctorScheduleController
 * Handles doctor schedule management
 * Use Cases: View doctor schedule, Manage schedule (Add/Update/Delete)
 */
class DoctorScheduleController extends Controller
{
    /**
     * Get all schedules with filters
     * GET /api/schedules
     * Accessible: Doctor, Admin, Super Admin
     */
    public function index(Request $request)
    {
        $query = DoctorSchedule::with(['doctor', 'department']);

        // If user is a doctor, only show their own schedules
        $user = auth()->user();
        if ($user && $user->role === 'doctor') {
            $query->where('doctor_id', $user->id);
        }

        // Filter by doctor
        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        // Filter by department
        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [
                Carbon::parse($request->start_date),
                Carbon::parse($request->end_date)
            ]);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Get only available schedules
        if ($request->boolean('available_only', false)) {
            $query->available();
        }

        // Sort by date
        $schedules = $query->orderBy('date')->orderBy('start_time')->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $schedules,
            'message' => 'Schedules retrieved successfully',
        ]);
    }

    /**
     * Get doctor's schedule
     * GET /api/doctors/{doctorId}/schedules
     * Accessible: Patient, Doctor, Admin, Super Admin
     * Note: doctorId can be either doctors.id OR users.id (for doctor role users)
     */
    public function doctorSchedules($doctorId, Request $request)
    {
        // Try to find by doctors.id first, then by user_id
        $doctorRecord = \App\Models\Doctor::find($doctorId);
        $userId = $doctorRecord ? $doctorRecord->user_id : $doctorId;
        $doctorModel = $doctorRecord ?: \App\Models\Doctor::where('user_id', $doctorId)->first();
        
        $query = DoctorSchedule::where('doctor_id', $userId)
            ->with('department')
            ->where('date', '>=', now()->toDateString());

        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        // Order by date then time
        $schedules = $query->orderBy('date')->orderBy('start_time')->get();

        // Build a fast lookup set for already-booked exact appointment slots
        $bookedSlotKeys = [];
        if ($doctorModel) {
            $bookedSlotKeys = Appointment::where('doctor_id', $doctorModel->id)
                ->where('date', '>=', now()->toDateString())
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->get(['date', 'time'])
                ->map(function ($appointment) {
                    return Carbon::parse($appointment->date)->toDateString() . '|' . Carbon::parse($appointment->time)->format('H:i');
                })
                ->unique()
                ->values()
                ->all();
        }

        $schedules = $schedules->map(function ($schedule) use ($bookedSlotKeys) {
            $remainingSlots = max(0, (int) $schedule->available_slots - (int) ($schedule->booked_slots ?? 0));
            $slotKey = Carbon::parse($schedule->date)->toDateString() . '|' . Carbon::parse($schedule->start_time)->format('H:i');
            $isBooked = in_array($slotKey, $bookedSlotKeys, true) || $remainingSlots <= 0 || $schedule->status !== 'available';

            $schedule->remaining_slots = $remainingSlots;
            $schedule->is_booked = $isBooked;
            $schedule->display_status = $isBooked ? 'booked' : 'available';

            return $schedule;
        })->values();

        return response()->json([
            'status' => 'success',
            'data' => $schedules,
            'message' => 'Doctor schedules retrieved successfully',
        ]);
    }

    /**
     * Get single schedule
     * GET /api/schedules/{id}
     */
    public function show($id)
    {
        $schedule = DoctorSchedule::with(['doctor', 'department'])->find($id);

        if (!$schedule) {
            return response()->json([
                'status' => 'error',
                'message' => 'Schedule not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $schedule,
        ]);
    }

    /**
     * Create new schedule
     * POST /api/schedules
     * Accessible: Doctor (own), Admin, Super Admin
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        
        // Auto-fill doctor_id for doctor users
        $doctorId = $request->doctor_id ?? $user->id;
        
        // Get department_id from Doctor model if not provided
        $departmentId = $request->department_id;
        if (!$departmentId) {
            $doctorRecord = \App\Models\Doctor::where('user_id', $doctorId)->first();
            if ($doctorRecord) {
                $departmentId = $doctorRecord->department_id;
            }
        }
        
        // Merge auto-filled values
        $request->merge([
            'doctor_id' => $doctorId,
            'department_id' => $departmentId,
        ]);
        
        $validated = $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'department_id' => 'required|exists:departments,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'slot_duration' => 'nullable|integer|min:15|max:120',
            'available_slots' => 'required|integer|min:1',
        ]);

        // Check doctor authorization
        if ($user->role === 'doctor' && $user->id !== (int)$request->doctor_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'You can only create schedules for yourself',
            ], 403);
        }

        // Verify doctor record exists
        $doctorRecord = \App\Models\Doctor::where('user_id', $request->doctor_id)->first();
        if (!$doctorRecord) {
            return response()->json([
                'status' => 'error',
                'message' => 'Doctor profile not found. Please contact admin to set up your doctor profile.',
            ], 422);
        }

        $schedule = DoctorSchedule::create(array_merge($validated, ['status' => 'available']));

        // Log action
        \App\Models\AuditLog::log('create', $schedule, $schedule->id, null, $validated, 'Schedule created');

        return response()->json([
            'status' => 'success',
            'data' => $schedule,
            'message' => 'Schedule created successfully',
        ], 201);
    }

    /**
     * Update schedule
     * PUT /api/schedules/{id}
     * Accessible: Doctor (own), Admin, Super Admin
     */
    public function update(Request $request, $id)
    {
        $schedule = DoctorSchedule::find($id);

        if (!$schedule) {
            return response()->json([
                'status' => 'error',
                'message' => 'Schedule not found',
            ], 404);
        }

        // Check authorization
        if (auth()->user()->role === 'doctor' && auth()->user()->id !== $schedule->doctor_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'date' => 'sometimes|date|after_or_equal:today',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'available_slots' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:available,unavailable,cancelled',
        ]);

        $oldValues = $schedule->getAttributes();
        $schedule->update($validated);

        // Log action
        \App\Models\AuditLog::log('update', $schedule, $schedule->id, $oldValues, $validated, 'Schedule updated');

        return response()->json([
            'status' => 'success',
            'data' => $schedule,
            'message' => 'Schedule updated successfully',
        ]);
    }

    /**
     * Delete schedule
     * DELETE /api/schedules/{id}
     * Accessible: Doctor (own), Admin, Super Admin
     */
    public function destroy($id)
    {
        $schedule = DoctorSchedule::find($id);

        if (!$schedule) {
            return response()->json([
                'status' => 'error',
                'message' => 'Schedule not found',
            ], 404);
        }

        // Check authorization - Allow doctor (own), admin, or super admin
        $user = auth()->user();
        $isOwnSchedule = $user && $user->role === 'doctor' && $user->id === $schedule->doctor_id;
        $isAdmin = $user && ($user->role === 'admin' || $user->role === 'super_admin');
        
        if (!($isOwnSchedule || $isAdmin)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - You can only delete your own schedules',
            ], 403);
        }

        // Log action
        \App\Models\AuditLog::log('delete', $schedule, $schedule->id, $schedule->getAttributes(), null, 'Schedule deleted');

        // Find the doctor record, then all active appointments for this schedule date
        $doctorRecord = \App\Models\Doctor::where('user_id', $schedule->doctor_id)->first();
        $appointmentDoctorId = $doctorRecord?->id;

        $affectedAppointments = collect();
        if ($appointmentDoctorId) {
            /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Appointment> $affectedAppointments */
            $affectedAppointments = Appointment::where('doctor_id', $appointmentDoctorId)
            ->where('date', Carbon::parse($schedule->date)->toDateString())
            ->whereIn('status', ['pending', 'confirmed'])
            ->with(['user', 'hospital', 'doctor.user', 'department'])
            ->get();
        }

        foreach ($affectedAppointments as $appointment) {
            // Cancel the appointment
            $appointment->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => 'Doctor schedule cancelled for this date by the doctor.',
            ]);

            // Send cancellation/refund email to patient
            try {
                Mail::to($appointment->user->email)
                    ->send(new ScheduleCancelledByDoctor($appointment));
            } catch (\Exception $e) {
                Log::error('Failed to send schedule cancellation email', [
                    'appointment_id' => $appointment->id,
                    'patient_email'  => $appointment->user->email ?? 'N/A',
                    'error'          => $e->getMessage(),
                ]);
            }
        }

        $schedule->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule deleted successfully',
        ]);
    }
}

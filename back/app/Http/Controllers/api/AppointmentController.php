<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\AppointmentBooked;

class AppointmentController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        // Validate all required appointment fields
        $validator = Validator::make($request->all(), [
            'doctor_id' => 'required|exists:doctors,id',
            'hospital_id' => 'required|exists:hospitals,id',
            'department_id' => 'nullable|exists:departments,id',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required',
            'reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        try {
            // Get doctor and verify they belong to the hospital
            $doctor = \App\Models\Doctor::findOrFail($request->doctor_id);
            if ($doctor->hospital_id != $request->hospital_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Doctor does not belong to the selected hospital'
                ], 422);
            }

            // Prevent double-booking for the exact same slot (doctor + date + time)
            $slotAlreadyBooked = Appointment::where('doctor_id', $request->doctor_id)
                ->where('date', $request->date)
                ->where('time', $request->time)
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->exists();

            if ($slotAlreadyBooked) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This slot is already booked. Please choose another time.'
                ], 422);
            }

            // If this time belongs to a doctor schedule, ensure slot capacity exists
            $matchedSchedule = DoctorSchedule::where('doctor_id', $doctor->user_id)
                ->where('date', $request->date)
                ->where('start_time', '<=', $request->time)
                ->where('end_time', '>', $request->time)
                ->where('status', 'available')
                ->first();

            if ($matchedSchedule && !$matchedSchedule->hasAvailableSlots()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Selected schedule is full. Please choose another slot.'
                ], 422);
            }

            // Check daily patient limit
            $dailyLimit = $doctor->daily_patient_limit ?? 20;
            $appointmentsOnDate = Appointment::where('doctor_id', $request->doctor_id)
                ->where('date', $request->date)
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where('payment_status', 'completed') // Only count paid appointments
                ->count();

            if ($appointmentsOnDate >= $dailyLimit) {
                return response()->json([
                    'status' => 'error',
                    'message' => "This doctor has reached the maximum number of patients ({$dailyLimit}) for this date. Please choose another date.",
                    'slots_remaining' => 0
                ], 422);
            }

            // Check if user already has an appointment with this doctor on this date
            $existingAppointment = Appointment::where('user_id', $user->id)
                ->where('doctor_id', $request->doctor_id)
                ->where('date', $request->date)
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->first();

            if ($existingAppointment) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You already have an appointment with this doctor on this date'
                ], 422);
            }

            // Use doctor's department if not provided
            $departmentId = $request->department_id ?? $doctor->department_id;

            // Get consultation fee from doctor
            $paymentAmount = $doctor->consultation_fee ?? 500; // Default to 500 if not set

            // Create appointment
            $appointment = Appointment::create([
                'user_id' => $user->id,
                'doctor_id' => $request->doctor_id,
                'hospital_id' => $request->hospital_id,
                'department_id' => $departmentId,
                'date' => $request->date,
                'time' => $request->time,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_amount' => $paymentAmount,
            ]);

            // Mark one slot as booked when appointment is created
            if ($matchedSchedule) {
                $matchedSchedule->bookSlot();

                // If no slots remain, mark schedule unavailable so doctors can see full occupancy
                if (!$matchedSchedule->hasAvailableSlots()) {
                    $matchedSchedule->status = 'unavailable';
                    $matchedSchedule->save();
                }
            }
            
            // Note: Notification to doctor will be sent AFTER payment is completed
            // Patient will be redirected to payment page

            // send confirmation email to patient (appointment created, awaiting payment)
            try {
                Mail::to($user->email)->send(new AppointmentBooked($appointment));
            } catch (\Exception $e) {
                // don't fail booking if mail fails; log and continue
                logger()->error('Appointment mail error: '.$e->getMessage());
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Appointment booked successfully',
                'appointment' => $appointment->load('doctor', 'hospital', 'department')
            ], 201);
        } catch (\Exception $e) {
            logger()->error('Appointment booking error: '.$e->getMessage().' | '.$e->getFile().' | Line '.$e->getLine());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to book appointment: '.$e->getMessage()
            ], 500);
        }
    }

    // List appointments: doctor sees hospital appointments, admin sees hospital, patient sees own
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            $q = Appointment::query();
        } elseif ($user->isAdmin() || $user->isDoctor()) {
            $q = Appointment::where('hospital_id', $user->hospital_id);
        } else {
            $q = Appointment::where('user_id', $user->id);
        }

        $appointments = $q->with(['doctor', 'hospital', 'department', 'patient'])->orderBy('date','asc')->paginate(20);
        return response()->json(['status'=>'success','data'=>$appointments]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::with(['doctor', 'hospital', 'department', 'patient'])->findOrFail($id);

        if ($user->isSuperAdmin()) {
            // ok
        } elseif ($user->isAdmin() || $user->isDoctor()) {
            if ($appointment->hospital_id !== $user->hospital_id) return response()->json(['message'=>'Unauthorized'],403);
        } elseif ($appointment->user_id !== $user->id) {
            return response()->json(['message'=>'Unauthorized'],403);
        }

        return response()->json(['status'=>'success','appointment'=>$appointment]);
    }

    // Update appointment status (doctor/admin)
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::findOrFail($id);

        if (!($user->isAdmin() || $user->isDoctor() || $user->isSuperAdmin())) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        if (!$user->isSuperAdmin() && $appointment->hospital_id !== $user->hospital_id) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        $appointment->status = $request->status;
        if ($request->filled('notes')) $appointment->notes = $request->notes;
        $appointment->save();

        return response()->json(['status'=>'success','appointment'=>$appointment->load('doctor', 'hospital', 'department', 'patient')]);
    }

    // Reschedule appointment (patient can reschedule their own, admin/doctor can reschedule any)
    public function reschedule(Request $request, $id)
    {
        $user = auth()->user();
        $appointment = Appointment::findOrFail($id);

        // Check authorization
        if (!($user->isSuperAdmin() || ($user->isAdmin() && $appointment->hospital_id == $user->hospital_id) || ($user->isDoctor() && $appointment->hospital_id == $user->hospital_id))) {
            if ($appointment->user_id !== $user->id) {
                return response()->json(['message'=>'Unauthorized'], 403);
            }
        }

        // Validate new date
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after:today',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        // Store old date for notification
        $oldDate = $appointment->date;

        try {
            // Update appointment
            $appointment->date = $request->date;
            $appointment->status = 'pending'; // Reset to pending when rescheduled
            if ($request->filled('notes')) {
                $appointment->notes = $request->notes;
            }
            $appointment->save();

            // Send notification to patient about reschedule
            $patient = $appointment->user;
            $patient->notify(new \App\Notifications\AppointmentRescheduled($appointment, $oldDate));

            return response()->json([
                'status'=>'success',
                'message'=>'Appointment rescheduled successfully',
                'appointment'=>$appointment->fresh()->load('doctor.user', 'hospital', 'department')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to reschedule appointment: '.$e->getMessage()
            ], 500);
        }
    }

    // Cancel appointment
    public function adminCancel(Request $request, $id)
    {
        $user = auth()->user();
        $appointment = Appointment::findOrFail($id);

        if (!($user->isSuperAdmin() || ($user->isAdmin() && $appointment->hospital_id == $user->hospital_id) || ($user->isDoctor() && $appointment->hospital_id == $user->hospital_id))) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
        }

        try {
            $appointment->status = 'cancelled';
            $appointment->cancelled_at = now();
            
            if ($request->filled('reason')) {
                $appointment->cancellation_reason = $request->reason;
                $appointment->notes = ($appointment->notes ?? '') . "\n[Cancellation Reason] " . $request->reason;
            }
            $appointment->save();

            // Notify patient about cancellation
            $patient = $appointment->user;
            $patient->notify(new \App\Notifications\AppointmentCancelled($appointment));

            return response()->json([
                'status'=>'success',
                'message'=>'Appointment cancelled successfully',
                'appointment'=>$appointment->load('doctor.user', 'hospital', 'department')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to cancel appointment: '.$e->getMessage()
            ], 500);
        }
    }

    // Doctor views their own appointments
    public function doctorAppointments(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isDoctor()) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        // Get doctor's ID
        $doctor = \App\Models\Doctor::where('user_id', $user->id)->first();
        if (!$doctor) {
            return response()->json(['status'=>'error','message'=>'Doctor profile not found'], 404);
        }

        // Get doctor's appointments - show all appointments regardless of payment status
        $appointments = Appointment::where('doctor_id', $doctor->id)
            ->with(['user', 'hospital', 'department', 'doctor'])
            ->orderBy('date', 'asc')
            ->paginate(20);

        return response()->json(['status'=>'success','data'=>$appointments]);
    }

    // Doctor accept appointment
    public function acceptAppointment(Request $request, $id)
    {
        $user = $request->user();
        
        if (!$user->isDoctor()) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $appointment = Appointment::findOrFail($id);
        
        // Verify this is doctor's appointment
        $doctor = \App\Models\Doctor::where('user_id', $user->id)->first();
        if (!$doctor || $appointment->doctor_id !== $doctor->id) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        if ($appointment->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only pending appointments can be accepted'
            ], 422);
        }

        try {
            $validator = Validator::make($request->all(), [
                'notes' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
            }

            $appointment->status = 'confirmed';
            $appointment->confirmed_at = now();
            if ($request->filled('notes')) {
                $appointment->notes = $request->notes;
            }
            $appointment->save();

            // No notification sent to patient - appointment is auto-confirmed after payment
            // Doctor only confirms/reviews without sending emails

            return response()->json([
                'status'=>'success',
                'message'=>'Appointment confirmed successfully',
                'appointment'=>$appointment->load('doctor', 'hospital', 'department', 'user')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to accept appointment: '.$e->getMessage()
            ], 500);
        }
    }

    // Doctor reject appointment
    public function rejectAppointment(Request $request, $id)
    {
        $user = $request->user();
        
        if (!$user->isDoctor()) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        $appointment = Appointment::findOrFail($id);
        
        // Verify this is doctor's appointment
        $doctor = \App\Models\Doctor::where('user_id', $user->id)->first();
        if (!$doctor || $appointment->doctor_id !== $doctor->id) {
            return response()->json(['message'=>'Unauthorized'], 403);
        }

        if ($appointment->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only pending appointments can be rejected'
            ], 422);
        }

        try {
            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json(['status'=>'error','errors'=>$validator->errors()], 422);
            }

            $appointment->status = 'cancelled';
            $appointment->cancelled_at = now();
            $appointment->cancellation_reason = $request->reason;
            $appointment->notes = ($appointment->notes ?? '') . "\n[Rejection Reason] " . $request->reason;
            $appointment->save();

            // No notification sent to patient - doctor only manages appointments

            return response()->json([
                'status'=>'success',
                'message'=>'Appointment rejected successfully',
                'appointment'=>$appointment->load('doctor', 'hospital', 'department', 'user')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'=>'error',
                'message'=>'Failed to reject appointment: '.$e->getMessage()
            ], 500);
        }
    }

    // Doctor cancels/deletes their own appointment from dashboard
    public function doctorCancelAppointment(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment = Appointment::findOrFail($id);

        // Verify appointment belongs to this doctor
        $doctor = \App\Models\Doctor::where('user_id', $user->id)->first();
        if (!$doctor || $appointment->doctor_id !== $doctor->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($appointment->status === 'cancelled') {
            return response()->json([
                'status' => 'success',
                'message' => 'Appointment already cancelled',
                'appointment' => $appointment,
            ]);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $appointment->status = 'cancelled';
        $appointment->cancelled_at = now();
        $appointment->cancellation_reason = $request->reason ?: 'Deleted by doctor from dashboard';
        $appointment->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Appointment cancelled successfully',
            'appointment' => $appointment->load('doctor', 'hospital', 'department', 'user'),
        ]);
    }

    // Doctor marks appointment as completed
    public function completeAppointment(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isDoctor()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment = Appointment::findOrFail($id);

        $doctor = \App\Models\Doctor::where('user_id', $user->id)->first();
        if (!$doctor || $appointment->doctor_id !== $doctor->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($appointment->status !== 'confirmed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only confirmed appointments can be marked as completed',
            ], 422);
        }

        $appointment->status = 'completed';
        $appointment->completed_at = now();
        $appointment->save();

        return response()->json([
            'status'      => 'success',
            'message'     => 'Appointment marked as completed',
            'appointment' => $appointment->load('doctor', 'hospital', 'department', 'user'),
        ]);
    }

    // Admin / super-admin complete
    public function complete(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::findOrFail($id);

        if (!$user->isSuperAdmin() && !($user->isAdmin() && $appointment->hospital_id == $user->hospital_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->status = 'completed';
        $appointment->completed_at = now();
        $appointment->save();

        return response()->json([
            'status'      => 'success',
            'message'     => 'Appointment marked as completed',
            'appointment' => $appointment->load('doctor', 'hospital', 'department', 'user'),
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        $appointments = Appointment::where('user_id', $user->id)
            ->with(['doctor', 'hospital', 'department'])
            ->orderBy('date', 'desc')
            ->get();

        return response()->json(['status' => 'success', 'data' => $appointments]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::findOrFail($id);

        if ($appointment->user_id !== $user->id && !$user->isAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->delete();
        return response()->json(['status' => 'success', 'message' => 'Appointment deleted']);
    }

    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $appointment = Appointment::where('user_id', $user->id)->findOrFail($id);

        $appointment->status = 'cancelled';
        $appointment->cancelled_at = now();
        $appointment->save();

        return response()->json(['status' => 'success', 'message' => 'Appointment cancelled', 'appointment' => $appointment]);
    }
}
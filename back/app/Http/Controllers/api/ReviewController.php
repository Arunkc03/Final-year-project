<?php

namespace App\Http\Controllers\api;

use App\Models\Review;
use App\Models\Appointment;
use App\Models\Doctor;
use Illuminate\Http\Request;

/**
 * ReviewController
 * Handles patient reviews for doctors
 * Use Cases: Write review
 */
class ReviewController extends Controller
{
    /**
     * Get doctor reviews
     * GET /api/reviews/doctor/{doctorId}
     */
    public function doctorReviews($doctorId)
    {
        // Accept either doctors.id or users.id and normalize to doctor user id
        $doctorRecord = Doctor::find($doctorId);
        $resolvedDoctorUserId = $doctorRecord ? $doctorRecord->user_id : $doctorId;

        $reviews = Review::where('doctor_id', $resolvedDoctorUserId)
            ->approved()
            ->with('patient')
            ->paginate(10);

        $doctor = \App\Models\User::find($resolvedDoctorUserId);
        
        if (!$doctor) {
            return response()->json([
                'status' => 'error',
                'message' => 'Doctor not found',
            ], 404);
        }

        $averageRating = $doctor->getAverageRating();
        $totalReviews = $doctor->getTotalReviews();

        return response()->json([
            'status' => 'success',
            'data' => $reviews,
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'average_rating' => $averageRating,
                'total_reviews' => $totalReviews,
            ],
        ]);
    }

    /**
     * Get user's reviews
     * GET /api/reviews
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        if ($user->isAdmin() || $user->isSuperAdmin()) {
            // Admin sees all reviews for doctors in their hospital (all statuses)
            $query = Review::with(['patient', 'doctor'])
                ->whereHas('doctor', function ($q) use ($user) {
                    if ($user->isAdmin()) {
                        $q->where('hospital_id', $user->hospital_id);
                    }
                });
        } elseif ($user->isDoctor()) {
            // Doctor sees reviews about them (all statuses)
            $query = Review::where('doctor_id', $user->id)->with(['patient', 'doctor']);
        } else {
            // Patient sees reviews they wrote
            $query = Review::where('patient_id', $user->id)->with(['patient', 'doctor']);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json([
            'status' => 'success',
            'data'   => $reviews,
        ]);
    }

    /**
     * Create a review
     * POST /api/reviews
     * Accessible: Patient
     */
    public function store(Request $request)
    {
        // Only patients can write reviews
        if (!auth()->user()->isPatient()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only patients can write reviews',
            ], 403);
        }

        $validated = $request->validate([
            'doctor_id' => 'required|integer',
            'appointment_id' => 'nullable|exists:appointments,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $resolvedDoctorUserId = null;

        // Check if appointment belongs to patient and is completed/confirmed
        if ($request->has('appointment_id')) {
            $appointment = Appointment::with('doctor')->find($request->appointment_id);
            if (!$appointment) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Appointment not found',
                ], 404);
            }
            
            if ($appointment->user_id !== auth()->id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This appointment does not belong to you',
                ], 403);
            }

            // Allow review if appointment is completed, confirmed, or at least cancelled by doctor
            $allowedStatuses = ['completed', 'confirmed'];
            if (!in_array($appointment->status, $allowedStatuses)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You can only review after appointment is confirmed or completed',
                ], 422);
            }

            // Ensure patient is reviewing the doctor from this appointment
            $appointmentDoctorUserId = $appointment->doctor ? (int) $appointment->doctor->user_id : null;

            // For appointment-based reviews, trust appointment doctor to avoid ID ambiguity
            if ($appointmentDoctorUserId) {
                $resolvedDoctorUserId = $appointmentDoctorUserId;
            }
        }

        // Normalize doctor identifier: allow doctor user id or doctors table id
        if (!$resolvedDoctorUserId) {
            $inputDoctorId = (int) $request->doctor_id;
            $doctorUser = \App\Models\User::where('id', $inputDoctorId)->where('role', 'doctor')->first();
            if (!$doctorUser) {
                $doctorRecord = Doctor::find($inputDoctorId);
                if ($doctorRecord) {
                    $doctorUser = \App\Models\User::find($doctorRecord->user_id);
                }
            }

            if (!$doctorUser || !$doctorUser->isDoctor()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Doctor not found or inactive',
                ], 422);
            }

            $resolvedDoctorUserId = $doctorUser->id;
        }

        // Check if patient already reviewed this doctor for this appointment
        if ($request->has('appointment_id')) {
            $existing = Review::where('patient_id', auth()->id())
                ->where('doctor_id', $resolvedDoctorUserId)
                ->where('appointment_id', $request->appointment_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You have already reviewed this appointment',
                ], 422);
            }
        }

        $review = Review::create([
            'doctor_id' => $resolvedDoctorUserId,
            'appointment_id' => $request->appointment_id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'patient_id' => auth()->id(),
            'status' => 'pending', // Awaiting admin approval
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $review,
            'message' => 'Review submitted successfully. It will be published after admin approval.',
        ], 201);
    }

    /**
     * Update review (only if pending)
     * PUT /api/reviews/{id}
     */
    public function update(Request $request, $id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'status' => 'error',
                'message' => 'Review not found',
            ], 404);
        }

        // Check authorization
        if ($review->patient_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        // Can only edit pending reviews
        if ($review->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Can only edit pending reviews',
            ], 422);
        }

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $review,
            'message' => 'Review updated successfully',
        ]);
    }

    /**
     * Delete review
     * DELETE /api/reviews/{id}
     */
    public function destroy($id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'status' => 'error',
                'message' => 'Review not found',
            ], 404);
        }

        // Check authorization (patient who wrote it or admin)
        if ($review->patient_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $review->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Review deleted successfully',
        ]);
    }

    /**
     * Approve review (Admin/Super Admin)
     * PUT /api/reviews/{id}/approve
     */
    public function approve($id)
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'status' => 'error',
                'message' => 'Review not found',
            ], 404);
        }

        $review->approve();

        return response()->json([
            'status' => 'success',
            'data' => $review,
            'message' => 'Review approved successfully',
        ]);
    }

    /**
     * Reject review (Admin/Super Admin)
     * PUT /api/reviews/{id}/reject
     */
    public function reject($id)
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $review = Review::find($id);

        if (!$review) {
            return response()->json([
                'status' => 'error',
                'message' => 'Review not found',
            ], 404);
        }

        $review->reject();

        return response()->json([
            'status' => 'success',
            'data' => $review,
            'message' => 'Review rejected successfully',
        ]);
    }
}

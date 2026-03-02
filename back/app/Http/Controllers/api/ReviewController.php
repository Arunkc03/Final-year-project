<?php

namespace App\Http\Controllers\api;

use App\Models\Review;
use App\Models\Appointment;
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
        $reviews = Review::where('doctor_id', $doctorId)
            ->approved()
            ->with('patient')
            ->paginate(10);

        $doctor = \App\Models\User::find($doctorId);
        
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

        if ($user->isDoctor()) {
            // Doctor sees reviews about them
            $query = Review::where('doctor_id', $user->id);
        } else {
            // Patient sees reviews they wrote
            $query = Review::where('patient_id', $user->id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reviews = $query->with('doctor', 'patient')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $reviews,
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
            'doctor_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Check if appointment belongs to patient if provided
        if ($request->has('appointment_id')) {
            $appointment = Appointment::find($request->appointment_id);
            if ($appointment->user_id !== auth()->id()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized',
                ], 403);
            }
        }

        // Check if doctor exists and is active
        $doctor = \App\Models\User::find($request->doctor_id);
        if (!$doctor || !$doctor->isDoctor() || !$doctor->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Doctor not found or inactive',
            ], 422);
        }

        // Check if patient already reviewed this doctor for this appointment
        if ($request->has('appointment_id')) {
            $existing = Review::where('patient_id', auth()->id())
                ->where('doctor_id', $request->doctor_id)
                ->where('appointment_id', $request->appointment_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You have already reviewed this appointment',
                ], 422);
            }
        }

        $review = Review::create(array_merge(
            $validated,
            [
                'patient_id' => auth()->id(),
                'status' => 'pending', // Awaiting admin approval
            ]
        ));

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

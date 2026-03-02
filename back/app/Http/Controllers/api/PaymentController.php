<?php

namespace App\Http\Controllers\api;

use App\Models\Payment;
use App\Models\Appointment;
use Illuminate\Http\Request;

/**
 * PaymentController
 * Handles payment processing
 * Use Cases: Make payments, Track payment status
 */
class PaymentController extends Controller
{
    /**
     * Get user's payments
     * GET /api/payments
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $query = Payment::where('user_id', $user->id)->with('appointment');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $payments = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $payments,
        ]);
    }

    /**
     * Get single payment
     * GET /api/payments/{id}
     */
    public function show($id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment not found',
            ], 404);
        }

        // Check authorization
        if ($payment->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $payment,
        ]);
    }

    /**
     * Create payment
     * POST /api/payments
     * Accessible: Patient
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:card,cash,online_transfer',
            'description' => 'nullable|string',
        ]);

        // Get appointment
        $appointment = Appointment::find($request->appointment_id);

        // Verify authorization
        if ($appointment->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        // Check if appointment needs payment
        if ($appointment->payment_status === 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'This appointment already has a completed payment',
            ], 422);
        }

        // Verify amount matches appointment
        if ($appointment->payment_amount != $request->amount) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment amount does not match appointment amount',
            ], 422);
        }

        // Create payment
        $payment = Payment::create(array_merge(
            $validated,
            [
                'user_id' => auth()->id(),
                'status' => 'pending',
                'transaction_id' => 'TXN-' . uniqid(),
            ]
        ));

        // Log action
        \App\Models\AuditLog::log('create', $payment, $payment->id, null, $validated, 'Payment initiated');

        return response()->json([
            'status' => 'success',
            'data' => $payment,
            'message' => 'Payment created successfully',
        ], 201);
    }

    /**
     * Process payment (simulate payment gateway)
     * POST /api/payments/{id}/process
     */
    public function process($id, Request $request)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment not found',
            ], 404);
        }

        // Check authorization
        if ($payment->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment can only be processed from pending status',
            ], 422);
        }

        // Validate payment details (this would integrate with real payment gateway)
        $validated = $request->validate([
            'card_number' => 'required_if:payment_method,card|regex:/^\d{16}$/',
            'cvv' => 'required_if:payment_method,card|regex:/^\d{3,4}$/',
            'expiry' => 'required_if:payment_method,card|date_format:m/y',
        ]);

        // Simulate payment processing
        $paymentSuccess = rand(1, 100) > 10; // 90% success rate for demo

        if ($paymentSuccess) {
            $payment->markAsCompleted();

            // Send notification
            \App\Services\NotificationService::sendPaymentNotification($payment);

            return response()->json([
                'status' => 'success',
                'data' => $payment,
                'message' => 'Payment processed successfully',
            ]);
        } else {
            $payment->markAsFailed();

            return response()->json([
                'status' => 'error',
                'data' => $payment,
                'message' => 'Payment processing failed. Please try again.',
            ], 422);
        }
    }

    /**
     * Refund payment
     * POST /api/payments/{id}/refund
     */
    public function refund($id)
    {
        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment not found',
            ], 404);
        }

        // Check authorization (admin or payment user)
        if ($payment->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        if ($payment->status !== 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only completed payments can be refunded',
            ], 422);
        }

        $payment->refund();

        // Send notification
        \App\Services\NotificationService::sendRefundNotification($payment);

        return response()->json([
            'status' => 'success',
            'data' => $payment,
            'message' => 'Payment refunded successfully',
        ]);
    }

    /**
     * Get payment statistics (Admin)
     * GET /api/payments/statistics
     */
    public function statistics()
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        $stats = [
            'total_payments' => Payment::count(),
            'completed_payments' => Payment::completed()->count(),
            'pending_payments' => Payment::pending()->count(),
            'failed_payments' => Payment::failed()->count(),
            'total_amount' => Payment::completed()->sum('amount'),
            'average_payment' => Payment::completed()->avg('amount'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $stats,
        ]);
    }
}

<?php

namespace App\Http\Controllers\api;

use App\Models\Payment;
use App\Models\Appointment;
use App\Services\KhaltiService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * KhaltiPaymentController
 * Handles Khalti payment gateway operations
 */
class KhaltiPaymentController extends Controller
{
    protected KhaltiService $khaltiService;

    public function __construct(KhaltiService $khaltiService)
    {
        $this->khaltiService = $khaltiService;
    }

    /**
     * Get Khalti public configuration
     * GET /api/khalti/config
     */
    public function getConfig()
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->khaltiService->getPublicConfig(),
        ]);
    }

    /**
     * Initiate Khalti payment for an appointment
     * POST /api/khalti/initiate
     */
    public function initiatePayment(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'amount' => 'required|numeric|min:10', // Minimum 10 NPR
        ]);

        $user = auth()->user();
        $appointment = Appointment::find($validated['appointment_id']);

        // Verify ownership
        if ($appointment->user_id !== $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        // Check if appointment already paid
        if ($appointment->payment_status === 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'This appointment has already been paid',
            ], 422);
        }

        // Verify amount
        if ($appointment->payment_amount != $validated['amount']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment amount does not match appointment amount',
            ], 422);
        }

        // Create or get pending payment record
        $payment = Payment::where('appointment_id', $appointment->id)
            ->where('status', 'pending')
            ->first();

        if (!$payment) {
            $payment = Payment::create([
                'appointment_id' => $appointment->id,
                'user_id' => $user->id,
                'amount' => $validated['amount'],
                'status' => 'pending',
                'payment_method' => 'khalti',
                'transaction_id' => 'KHL-' . uniqid(),
            ]);
        }

        // Build Khalti payment payload
        $payload = $this->khaltiService->buildPaymentPayload($payment, $appointment);

        // Initiate with Khalti
        $result = $this->khaltiService->initiatePayment($payload);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'] ?? 'Failed to initiate Khalti payment',
                'errors' => $result['errors'] ?? null,
            ], 422);
        }

        // Store Khalti pidx in payment record
        $payment->update([
            'khalti_pidx' => $result['data']['pidx'],
            'khalti_payment_url' => $result['data']['payment_url'] ?? null,
        ]);

        // Log action
        \App\Models\AuditLog::log('create', $payment, $payment->id, null, [
            'khalti_pidx' => $result['data']['pidx'],
            'amount' => $validated['amount'],
        ], 'Khalti payment initiated');

        return response()->json([
            'status' => 'success',
            'message' => 'Payment initiated successfully',
            'data' => [
                'payment_id' => $payment->id,
                'pidx' => $result['data']['pidx'],
                'payment_url' => $result['data']['payment_url'],
                'expires_at' => $result['data']['expires_at'] ?? null,
            ],
        ]);
    }

    /**
     * Verify Khalti payment (callback from Khalti)
     * GET /api/khalti/verify
     */
    public function verifyPayment(Request $request)
    {
        $pidx = $request->query('pidx');
        $status = $request->query('status');
        $transactionId = $request->query('transaction_id');
        $amount = $request->query('amount');
        $purchaseOrderId = $request->query('purchase_order_id');

        if (!$pidx) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment index (pidx) is required',
            ], 400);
        }

        // Find payment by pidx
        $payment = Payment::where('khalti_pidx', $pidx)->first();

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment not found',
            ], 404);
        }

        // Verify with Khalti
        $verification = $this->khaltiService->verifyPayment($pidx);

        if (!$verification['success']) {
            $payment->update(['status' => 'failed']);

            return response()->json([
                'status' => 'error',
                'message' => $verification['message'] ?? 'Payment verification failed',
            ], 422);
        }

        $khaltiData = $verification['data'];

        // Check if payment is completed
        if ($khaltiData['status'] === 'Completed') {
            $payment->update([
                'status' => 'completed',
                'transaction_id' => $khaltiData['transaction_id'] ?? $transactionId,
                'khalti_status' => $khaltiData['status'],
                'khalti_fee' => $khaltiData['fee_breakdown']['khalti_fee'] ?? 0,
                'paid_at' => now(),
            ]);

            // Update appointment - auto-confirm after payment (no doctor approval needed)
            $appointment = $payment->appointment;
            $appointment->update([
                'payment_status' => 'completed',
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);

            // Send payment notification to patient (in-app)
            NotificationService::sendPaymentNotification($payment);
            
            // Send in-app notification about confirmed appointment
            NotificationService::sendAppointmentNotification($appointment, 'confirmed');
            
            // Send email notification to patient
            try {
                \Illuminate\Support\Facades\Mail::to($appointment->user->email)
                    ->send(new \App\Mail\AppointmentConfirmed($appointment, $payment));
            } catch (\Exception $e) {
                logger()->error('Appointment confirmation email error: ' . $e->getMessage());
            }

            // Log action
            \App\Models\AuditLog::log('update', $payment, $payment->id, null, [
                'khalti_transaction_id' => $khaltiData['transaction_id'] ?? null,
                'status' => 'completed',
            ], 'Khalti payment completed - appointment auto-confirmed');

            return response()->json([
                'status' => 'success',
                'message' => 'Payment completed successfully',
                'data' => [
                    'payment_id' => $payment->id,
                    'transaction_id' => $khaltiData['transaction_id'] ?? null,
                    'amount' => KhaltiService::toNPR($khaltiData['total_amount']),
                    'status' => 'completed',
                ],
            ]);
        }

        // Handle other statuses
        $statusMap = [
            'Pending' => 'pending',
            'Initiated' => 'pending',
            'Refunded' => 'refunded',
            'Expired' => 'failed',
            'User canceled' => 'failed',
        ];

        $newStatus = $statusMap[$khaltiData['status']] ?? 'pending';
        $payment->update([
            'status' => $newStatus,
            'khalti_status' => $khaltiData['status'],
        ]);

        if ($newStatus === 'failed') {
            $payment->appointment->update(['payment_status' => 'failed']);
        }

        return response()->json([
            'status' => 'success',
            'message' => $this->khaltiService->getStatusDescription($khaltiData['status']),
            'data' => [
                'payment_id' => $payment->id,
                'khalti_status' => $khaltiData['status'],
                'status' => $newStatus,
            ],
        ]);
    }

    /**
     * Lookup payment status
     * GET /api/khalti/lookup/{paymentId}
     */
    public function lookupPayment($paymentId)
    {
        $payment = Payment::find($paymentId);

        if (!$payment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payment not found',
            ], 404);
        }

        // Check authorization (user owns payment or is admin)
        $user = auth()->user();
        if ($payment->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 403);
        }

        // If no Khalti pidx, return current status
        if (!$payment->khalti_pidx) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                ],
            ]);
        }

        // Lookup with Khalti
        $result = $this->khaltiService->verifyPayment($payment->khalti_pidx);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'payment_id' => $payment->id,
                'local_status' => $payment->status,
                'khalti_status' => $result['data']['status'],
                'transaction_id' => $result['data']['transaction_id'] ?? null,
                'amount' => KhaltiService::toNPR($result['data']['total_amount']),
            ],
        ]);
    }

    /**
     * Handle Khalti webhook (for server-to-server notifications)
     * POST /api/khalti/webhook
     */
    public function handleWebhook(Request $request)
    {
        Log::info('Khalti webhook received', $request->all());

        $pidx = $request->input('pidx');
        
        if (!$pidx) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $payment = Payment::where('khalti_pidx', $pidx)->first();

        if (!$payment) {
            Log::warning('Khalti webhook: Payment not found', ['pidx' => $pidx]);
            return response()->json(['message' => 'Payment not found'], 404);
        }

        // Verify payment status with Khalti
        $verification = $this->khaltiService->verifyPayment($pidx);

        if ($verification['success'] && $verification['is_completed']) {
            if ($payment->status !== 'completed') {
                $payment->update([
                    'status' => 'completed',
                    'transaction_id' => $verification['data']['transaction_id'] ?? null,
                    'khalti_status' => 'Completed',
                    'paid_at' => now(),
                ]);

                $payment->appointment->update(['payment_status' => 'completed']);
                NotificationService::sendPaymentNotification($payment);

                Log::info('Khalti payment completed via webhook', [
                    'payment_id' => $payment->id,
                    'pidx' => $pidx,
                ]);
            }
        }

        return response()->json(['message' => 'Webhook processed']);
    }
}

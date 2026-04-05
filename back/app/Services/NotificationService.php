<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Report;
use App\Models\Review;
use App\Models\User;

/**
 * NotificationService
 * Handles all notification-related operations
 */
class NotificationService
{
    /**
     * Send appointment booking notification
     */
    public static function sendAppointmentNotification(Appointment $appointment, $type = 'booked')
    {
        $messages = [
            'booked' => [
                'title' => 'Appointment Booked Successfully',
                'message' => "Your appointment with {$appointment->doctor->name} on " . \Carbon\Carbon::parse($appointment->date)->format('M d, Y') . " has been booked.",
            ],
            'confirmed' => [
                'title' => 'Appointment Confirmed',
                'message' => "Your appointment with {$appointment->doctor->name} on " . \Carbon\Carbon::parse($appointment->date)->format('M d, Y') . " has been confirmed.",
            ],
            'completed' => [
                'title' => 'Appointment Completed',
                'message' => "Your appointment with {$appointment->doctor->name} on " . \Carbon\Carbon::parse($appointment->date)->format('M d, Y') . " has been completed.",
            ],
            'cancelled' => [
                'title' => 'Appointment Cancelled',
                'message' => "Your appointment with {$appointment->doctor->name} on " . \Carbon\Carbon::parse($appointment->date)->format('M d, Y') . " has been cancelled.",
            ],
        ];

        $data = $messages[$type] ?? $messages['booked'];

        // Notify patient - only if user exists
        try {
            if ($appointment->user_id && User::where('id', $appointment->user_id)->exists()) {
                Notification::create([
                    'user_id' => $appointment->user_id,
                    'title' => $data['title'],
                    'message' => $data['message'],
                    'type' => 'appointment',
                    'related_model' => 'Appointment',
                    'related_id' => $appointment->id,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create patient notification', ['error' => $e->getMessage()]);
        }

        // Notify doctor if confirmed/completed - only if user exists
        if (in_array($type, ['confirmed', 'completed'])) {
            try {
                if ($appointment->doctor_id && User::where('id', $appointment->doctor_id)->exists()) {
                    Notification::create([
                        'user_id' => $appointment->doctor_id,
                        'title' => $data['title'],
                        'message' => "Appointment with " . ($appointment->user->name ?? 'Patient') . " on " . \Carbon\Carbon::parse($appointment->date)->format('M d, Y'),
                        'type' => 'appointment',
                        'related_model' => 'Appointment',
                        'related_id' => $appointment->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create doctor notification', ['error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Send payment notification
     */
    public static function sendPaymentNotification(Payment $payment)
    {
        try {
            if ($payment->user_id && User::where('id', $payment->user_id)->exists()) {
                Notification::create([
                    'user_id' => $payment->user_id,
                    'title' => 'Payment Successful',
                    'message' => "Payment of {$payment->amount} for appointment has been processed successfully.",
                    'type' => 'payment',
                    'related_model' => 'Payment',
                    'related_id' => $payment->id,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create payment notification', ['error' => $e->getMessage(), 'user_id' => $payment->user_id]);
        }
    }

    /**
     * Send refund notification
     */
    public static function sendRefundNotification(Payment $payment)
    {
        try {
            if ($payment->user_id && User::where('id', $payment->user_id)->exists()) {
                Notification::create([
                    'user_id' => $payment->user_id,
                    'title' => 'Refund Processed',
                    'message' => "Your refund of {$payment->amount} has been processed successfully.",
                    'type' => 'payment',
                    'related_model' => 'Payment',
                    'related_id' => $payment->id,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create refund notification', ['error' => $e->getMessage(), 'user_id' => $payment->user_id]);
        }
    }

    /**
     * Send review notification
     */
    public static function sendReviewNotification(Review $review, $status = 'submitted')
    {
        if ($status === 'submitted') {
            try {
                if ($review->doctor_id && User::where('id', $review->doctor_id)->exists()) {
                    Notification::create([
                        'user_id' => $review->doctor_id,
                        'title' => 'New Review Received',
                        'message' => "{$review->patient->name} has written a {$review->rating}-star review.",
                        'type' => 'review',
                        'related_model' => 'Review',
                        'related_id' => $review->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create review notification', ['error' => $e->getMessage(), 'user_id' => $review->doctor_id]);
            }
        } elseif ($status === 'approved') {
            try {
                if ($review->patient_id && User::where('id', $review->patient_id)->exists()) {
                    Notification::create([
                        'user_id' => $review->patient_id,
                        'title' => 'Review Approved',
                        'message' => 'Your review has been approved and is now visible to others.',
                        'type' => 'review',
                        'related_model' => 'Review',
                        'related_id' => $review->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create review approved notification', ['error' => $e->getMessage(), 'user_id' => $review->patient_id]);
            }
        } elseif ($status === 'rejected') {
            try {
                if ($review->patient_id && User::where('id', $review->patient_id)->exists()) {
                    Notification::create([
                        'user_id' => $review->patient_id,
                        'title' => 'Review Not Approved',
                        'message' => 'Your review could not be approved at this time.',
                        'type' => 'review',
                        'related_model' => 'Review',
                        'related_id' => $review->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create review rejected notification', ['error' => $e->getMessage(), 'user_id' => $review->patient_id]);
            }
        }
    }

    /**
     * Send report notification
     */
    public static function sendReportNotification(Report $report, $status = 'submitted')
    {
        if ($status === 'submitted') {
            try {
                if ($report->patient_id && User::where('id', $report->patient_id)->exists()) {
                    Notification::create([
                        'user_id' => $report->patient_id,
                        'title' => 'Report Submitted',
                        'message' => 'Your medical report has been submitted for review.',
                        'type' => 'report',
                        'related_model' => 'Report',
                        'related_id' => $report->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create report submitted notification', ['error' => $e->getMessage(), 'user_id' => $report->patient_id]);
            }
        } elseif ($status === 'approved') {
            try {
                if ($report->patient_id && User::where('id', $report->patient_id)->exists()) {
                    Notification::create([
                        'user_id' => $report->patient_id,
                        'title' => 'Report Approved',
                        'message' => 'Your medical report has been approved.',
                        'type' => 'report',
                        'related_model' => 'Report',
                        'related_id' => $report->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create report approved notification', ['error' => $e->getMessage(), 'user_id' => $report->patient_id]);
            }
        } elseif ($status === 'rejected') {
            try {
                if ($report->patient_id && User::where('id', $report->patient_id)->exists()) {
                    Notification::create([
                        'user_id' => $report->patient_id,
                        'title' => 'Report Rejected',
                        'message' => 'Your medical report has been rejected.',
                        'type' => 'report',
                        'related_model' => 'Report',
                        'related_id' => $report->id,
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('Failed to create report rejected notification', ['error' => $e->getMessage(), 'user_id' => $report->patient_id]);
            }
        }
    }

    /**
     * Send schedule notification
     */
    public static function sendScheduleNotification(DoctorSchedule $schedule, $type = 'created')
    {
        $messages = [
            'created' => 'You have created a new schedule.',
            'updated' => 'Your schedule has been updated.',
            'cancelled' => 'Your schedule has been cancelled.',
        ];

        try {
            if ($schedule->doctor_id && User::where('id', $schedule->doctor_id)->exists()) {
                Notification::create([
                    'user_id' => $schedule->doctor_id,
                    'title' => 'Schedule ' . ucfirst($type),
                    'message' => $messages[$type] ?? $messages['created'],
                    'type' => 'schedule',
                    'related_model' => 'DoctorSchedule',
                    'related_id' => $schedule->id,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create schedule notification', ['error' => $e->getMessage(), 'user_id' => $schedule->doctor_id]);
        }
    }

    /**
     * Send system notification
     */
    public static function sendSystemNotification($userId, $title, $message, $type = 'system')
    {
        try {
            if ($userId && User::where('id', $userId)->exists()) {
                Notification::create([
                    'user_id' => $userId,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to create system notification', ['error' => $e->getMessage(), 'user_id' => $userId]);
        }
    }

    /**
     * Send notification to multiple users
     */
    public static function sendBulkNotification($userIds, $title, $message, $type = 'system')
    {
        try {
            // Filter to only existing users
            $existingUserIds = User::whereIn('id', $userIds)->pluck('id')->toArray();
            
            if (empty($existingUserIds)) {
                \Log::warning('No valid users found for bulk notification', ['requested_user_ids' => $userIds]);
                return;
            }

            $notifications = array_map(function ($userId) use ($title, $message, $type) {
                return [
                    'user_id' => $userId,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }, $existingUserIds);

            Notification::insert($notifications);
        } catch (\Exception $e) {
            \Log::error('Failed to create bulk notifications', ['error' => $e->getMessage(), 'user_count' => count($userIds)]);
        }
    }

    /**
     * Get unread notifications count for user
     */
    public static function getUnreadCount($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    /**
     * Mark all notifications as read for user
     */
    public static function markAllAsRead($userId)
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }
}

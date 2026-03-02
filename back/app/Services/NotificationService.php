<?php

namespace App\Services;


use App\Models\Notification;
use App\Models\User;
use App\Models\Payment;
use App\Models\Appointment;

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

        // Notify patient
        Notification::create([
            'user_id' => $appointment->user_id,
            'title' => $data['title'],
            'message' => $data['message'],
            'type' => 'appointment',
            'related_model' => 'Appointment',
            'related_id' => $appointment->id,
        ]);

        // Notify doctor if confirmed/completed
        if (in_array($type, ['confirmed', 'completed'])) {
            Notification::create([
                'user_id' => $appointment->doctor_id,
                'title' => $data['title'],
                'message' => "Appointment with {$appointment->patient->name} on " . \Carbon\Carbon::parse($appointment->date)->format('M d, Y'),
                'type' => 'appointment',
                'related_model' => 'Appointment',
                'related_id' => $appointment->id,
            ]);
        }
    }

    /**
     * Send payment notification
     */
    public static function sendPaymentNotification(Payment $payment)
    {
        Notification::create([
            'user_id' => $payment->user_id,
            'title' => 'Payment Successful',
            'message' => "Payment of {$payment->amount} for appointment has been processed successfully.",
            'type' => 'payment',
            'related_model' => 'Payment',
            'related_id' => $payment->id,
        ]);
    }

    /**
     * Send refund notification
     */
    public static function sendRefundNotification(Payment $payment)
    {
        Notification::create([
            'user_id' => $payment->user_id,
            'title' => 'Refund Processed',
            'message' => "Your refund of {$payment->amount} has been processed successfully.",
            'type' => 'payment',
            'related_model' => 'Payment',
            'related_id' => $payment->id,
        ]);
    }

    /**
     * Send review notification
     */
    public static function sendReviewNotification(\App\Models\Review $review, $status = 'submitted')
    {
        if ($status === 'submitted') {
            Notification::create([
                'user_id' => $review->doctor_id,
                'title' => 'New Review Received',
                'message' => "{$review->patient->name} has written a {$review->rating}-star review.",
                'type' => 'review',
                'related_model' => 'Review',
                'related_id' => $review->id,
            ]);
        } elseif ($status === 'approved') {
            Notification::create([
                'user_id' => $review->patient_id,
                'title' => 'Review Approved',
                'message' => 'Your review has been approved and is now visible to others.',
                'type' => 'review',
                'related_model' => 'Review',
                'related_id' => $review->id,
            ]);
        } elseif ($status === 'rejected') {
            Notification::create([
                'user_id' => $review->patient_id,
                'title' => 'Review Not Approved',
                'message' => 'Your review could not be approved at this time.',
                'type' => 'review',
                'related_model' => 'Review',
                'related_id' => $review->id,
            ]);
        }
    }

    /**
     * Send report notification
     */
    public static function sendReportNotification(\App\Models\Report $report, $status = 'submitted')
    {
        if ($status === 'submitted') {
            Notification::create([
                'user_id' => $report->patient_id,
                'title' => 'Report Submitted',
                'message' => 'Your medical report has been submitted for review.',
                'type' => 'report',
                'related_model' => 'Report',
                'related_id' => $report->id,
            ]);
        } elseif ($status === 'approved') {
            Notification::create([
                'user_id' => $report->patient_id,
                'title' => 'Report Approved',
                'message' => 'Your medical report has been approved.',
                'type' => 'report',
                'related_model' => 'Report',
                'related_id' => $report->id,
            ]);
        } elseif ($status === 'rejected') {
            Notification::create([
                'user_id' => $report->patient_id,
                'title' => 'Report Rejected',
                'message' => 'Your medical report has been rejected.',
                'type' => 'report',
                'related_model' => 'Report',
                'related_id' => $report->id,
            ]);
        }
    }

    /**
     * Send schedule notification
     */
    public static function sendScheduleNotification(\App\Models\DoctorSchedule $schedule, $type = 'created')
    {
        $messages = [
            'created' => 'You have created a new schedule.',
            'updated' => 'Your schedule has been updated.',
            'cancelled' => 'Your schedule has been cancelled.',
        ];

        Notification::create([
            'user_id' => $schedule->doctor_id,
            'title' => 'Schedule ' . ucfirst($type),
            'message' => $messages[$type] ?? $messages['created'],
            'type' => 'schedule',
            'related_model' => 'DoctorSchedule',
            'related_id' => $schedule->id,
        ]);
    }

    /**
     * Send system notification
     */
    public static function sendSystemNotification($userId, $title, $message, $type = 'system')
    {
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);
    }

    /**
     * Send notification to multiple users
     */
    public static function sendBulkNotification($userIds, $title, $message, $type = 'system')
    {
        $notifications = array_map(function ($userId) use ($title, $message, $type) {
            return [
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $userIds);

        Notification::insert($notifications);
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

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentCancelled extends Notification implements ShouldQueue
{
    use Queueable;

    public $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Appointment Cancelled')
            ->line('Your appointment has been cancelled.')
            ->line('Appointment Date: ' . date('M d, Y', strtotime($this->appointment->date)))
            ->line('Doctor: ' . $this->appointment->doctor->user->name ?? 'N/A')
            ->line('Hospital: ' . $this->appointment->hospital->name ?? 'N/A')
            ->when($this->appointment->cancellation_reason, function ($message) {
                return $message->line('Reason: ' . $this->appointment->cancellation_reason);
            })
            ->action('Book New Appointment', url('/dashboard/appointments'))
            ->line('Thank you for using our Hospital Management System!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'appointment_id' => $this->appointment->id,
            'cancelled_at' => $this->appointment->cancelled_at,
            'cancellation_reason' => $this->appointment->cancellation_reason,
            'doctor_id' => $this->appointment->doctor_id,
            'type' => 'appointment_cancelled',
            'message' => 'Your appointment with Dr. ' . ($this->appointment->doctor->user->name ?? 'N/A') . ' has been cancelled.',
        ];
    }
}

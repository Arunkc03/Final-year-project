<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentRejected extends Notification implements ShouldQueue
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
            ->subject('Your Appointment Request Has Been Declined')
            ->line('Unfortunately, your appointment request has been declined by the doctor.')
            ->line('Appointment Details:')
            ->line('Doctor: ' . ($this->appointment->doctor->user->name ?? 'N/A'))
            ->line('Hospital: ' . ($this->appointment->hospital->name ?? 'N/A'))
            ->line('Requested Date: ' . date('M d, Y', strtotime($this->appointment->date)))
            ->line('Requested Time: ' . $this->appointment->time)
            ->when($this->appointment->cancellation_reason, function ($message) {
                return $message->line('Reason: ' . $this->appointment->cancellation_reason);
            })
            ->action('Book Another Appointment', url('/dashboard/appointments'))
            ->line('Please try scheduling with another available time slot or contact the hospital directly.');
    }

    public function toDatabase($notifiable)
    {
        return [
            'appointment_id' => $this->appointment->id,
            'doctor_id' => $this->appointment->doctor_id,
            'doctor_name' => $this->appointment->doctor->user->name ?? 'N/A',
            'hospital_name' => $this->appointment->hospital->name ?? 'N/A',
            'cancellation_reason' => $this->appointment->cancellation_reason,
            'type' => 'appointment_rejected',
            'message' => 'Your appointment request with Dr. ' . ($this->appointment->doctor->user->name ?? 'N/A') . ' has been declined.',
        ];
    }
}

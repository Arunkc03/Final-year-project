<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentAccepted extends Notification implements ShouldQueue
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
            ->subject('Your Appointment Has Been Accepted')
            ->line('Great news! Your appointment has been accepted by the doctor.')
            ->line('Appointment Details:')
            ->line('Doctor: ' . ($this->appointment->doctor->user->name ?? 'N/A'))
            ->line('Hospital: ' . ($this->appointment->hospital->name ?? 'N/A'))
            ->line('Date: ' . date('M d, Y', strtotime($this->appointment->date)))
            ->line('Time: ' . $this->appointment->time)
            ->when($this->appointment->notes, function ($message) {
                return $message->line('Notes: ' . $this->appointment->notes);
            })
            ->action('View Appointment', url('/dashboard/appointments/' . $this->appointment->id))
            ->line('Thank you for choosing our hospital!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'appointment_id' => $this->appointment->id,
            'doctor_id' => $this->appointment->doctor_id,
            'doctor_name' => $this->appointment->doctor->user->name ?? 'N/A',
            'hospital_name' => $this->appointment->hospital->name ?? 'N/A',
            'appointment_date' => $this->appointment->date,
            'appointment_time' => $this->appointment->time,
            'type' => 'appointment_accepted',
            'message' => 'Your appointment with Dr. ' . ($this->appointment->doctor->user->name ?? 'N/A') . ' on ' . date('M d, Y', strtotime($this->appointment->date)) . ' has been accepted.',
        ];
    }
}

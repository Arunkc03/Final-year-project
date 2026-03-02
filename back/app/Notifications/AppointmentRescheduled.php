<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentRescheduled extends Notification implements ShouldQueue
{
    use Queueable;

    public $appointment;
    public $oldDate;

    public function __construct(Appointment $appointment, $oldDate = null)
    {
        $this->appointment = $appointment;
        $this->oldDate = $oldDate;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Appointment Rescheduled')
            ->line('Your appointment has been rescheduled.')
            ->line('Previous Date: ' . ($this->oldDate ? date('M d, Y H:i', strtotime($this->oldDate)) : 'N/A'))
            ->line('New Date: ' . date('M d, Y', strtotime($this->appointment->date)))
            ->line('Doctor: ' . $this->appointment->doctor->user->name ?? 'N/A')
            ->line('Hospital: ' . $this->appointment->hospital->name ?? 'N/A')
            ->action('View Appointment', url('/dashboard/appointments/' . $this->appointment->id))
            ->line('Thank you for using our Hospital Management System!');
    }

    public function toDatabase($notifiable)
    {
        return [
            'appointment_id' => $this->appointment->id,
            'old_date' => $this->oldDate,
            'new_date' => $this->appointment->date,
            'doctor_id' => $this->appointment->doctor_id,
            'type' => 'appointment_rescheduled',
            'message' => 'Your appointment has been rescheduled to ' . date('M d, Y', strtotime($this->appointment->date)),
        ];
    }
}

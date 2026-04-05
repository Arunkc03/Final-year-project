<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Appointment;

class ScheduleCancelledByDoctor extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function build()
    {
        return $this->subject('Important: Your Appointment Has Been Cancelled – Visit Hospital for Refund')
                    ->view('emails.schedule_cancelled')
                    ->with(['appointment' => $this->appointment]);
    }
}

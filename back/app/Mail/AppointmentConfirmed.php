<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Appointment;
use App\Models\Payment;

class AppointmentConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;
    public $payment;

    /**
     * Create a new message instance.
     */
    public function __construct(Appointment $appointment, Payment $payment = null)
    {
        $this->appointment = $appointment;
        $this->payment = $payment;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Appointment Confirmed - Payment Successful')
                    ->view('emails.appointment_confirmed')
                    ->with([
                        'appointment' => $this->appointment,
                        'payment' => $this->payment,
                    ]);
    }
}

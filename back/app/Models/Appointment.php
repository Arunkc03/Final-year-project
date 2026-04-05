<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

/**
 * Appointment Model
 * Represents patient appointments with doctors
 */
class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'doctor_id',
        'hospital_id',
        'department_id',
        'date',
        'time',
        'status',
        'payment_status',
        'payment_amount',
        'reason',
        'notes',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'date' => 'date',
        'time' => 'datetime:H:i',
        'confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'payment_amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========== Relationships =========="
    
    /**
     * Get the patient who booked this appointment
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for patient - get the user who booked this appointment
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the doctor for this appointment
     */
    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }

    /**
     * Get the hospital of this appointment
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    /**
     * Get the department of this appointment
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the payment for this appointment
     */
    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Get the report associated with this appointment
     */
    public function report()
    {
        return $this->hasOne(Report::class);
    }

    /**
     * Get the review for this appointment
     */
    public function review()
    {
        return $this->hasOne(Review::class);
    }

    // ========== Scopes ==========
    
    /**
     * Scope: Get pending appointments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Get confirmed appointments
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Scope: Get completed appointments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope: Get cancelled appointments
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope: Get upcoming appointments
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', '!=', 'cancelled')
                     ->whereDate('date', '>=', now())
                     ->orderBy('date')
                     ->orderBy('time');
    }

    /**
     * Scope: Get past appointments
     */
    public function scopePast($query)
    {
        return $query->whereDate('date', '<', now())
                     ->orderBy('date', 'desc');
    }

    /**
     * Scope: Get appointments for patient
     */
    public function scopeForPatient($query, $patientId)
    {
        return $query->where('user_id', $patientId);
    }

    /**
     * Scope: Get appointments for doctor
     */
    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    /**
     * Scope: Get appointments for hospital
     */
    public function scopeForHospital($query, $hospitalId)
    {
        return $query->where('hospital_id', $hospitalId);
    }

    /**
     * Scope: Get appointments with pending payment
     */
    public function scopePendingPayment($query)
    {
        return $query->where('payment_status', 'pending');
    }

    // ========== Methods ==========
    
    /**
     * Confirm appointment
     */
    public function confirm()
    {
        $this->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);
        
        // Log action
        AuditLog::log('confirm', $this, $this->id, null, ['status' => 'confirmed']);
        
        return $this;
    }

    /**
     * Complete appointment
     */
    public function complete()
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
        
        AuditLog::log('complete', $this, $this->id, null, ['status' => 'completed']);
        
        return $this;
    }

    /**
     * Cancel appointment
     */
    public function cancel($reason = null)
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);
        
        // Return slot if schedule exists
        if ($this->doctor) {
            $schedule = DoctorSchedule::where('doctor_id', $this->doctor_id)
                ->where('date', $this->date)
                ->first();
            
            if ($schedule) {
                $schedule->cancelSlot();
            }
        }
        
        // Log action
        AuditLog::log('cancel', $this, $this->id, null, ['status' => 'cancelled']);
        
        return $this;
    }

    /**
     * Check if appointment is cancellable
     */
    public function isCancellable()
    {
        return in_array($this->status, ['pending', 'confirmed']) && 
               $this->date > now()->toDateString();
    }

    /**
     * Check if appointment requires payment
     */
    public function requiresPayment()
    {
        return $this->payment_amount > 0 && $this->payment_status !== 'completed';
    }

    /**
     * Get appointment status badge
     */
    public function getStatusBadge()
    {
        $badges = [
            'pending' => 'warning',
            'confirmed' => 'info',
            'completed' => 'success',
            'cancelled' => 'danger',
        ];
        
        return $badges[$this->status] ?? 'secondary';
    }
}

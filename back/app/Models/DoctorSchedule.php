<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * DoctorSchedule Model
 * Represents doctor availability schedules
 */
class DoctorSchedule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'doctor_id',
        'department_id',
        'date',
        'start_time',
        'end_time',
        'slot_duration',
        'available_slots',
        'booked_slots',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ========== Relationships =========="
    
    /**
     * Get the doctor that owns this schedule
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the department of this schedule
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get all appointments for this schedule
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    // ========== Scopes ==========
    
    /**
     * Scope: Get available schedules
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
                     ->whereDate('date', '>=', now())
                     ->where(function ($q) {
                         // available_slots > booked_slots OR booked_slots is NULL
                         $q->whereColumn('available_slots', '>', 'booked_slots')
                           ->orWhereNull('booked_slots');
                     });
    }

    /**
     * Scope: Get schedules for a specific date range
     */
    public function scopeDateBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope: Get schedules for a specific doctor
     */
    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    /**
     * Scope: Get upcoming schedules
     */
    public function scopeUpcoming($query)
    {
        return $query->whereDate('date', '>=', now()->toDateString())->orderBy('date');
    }

    // ========== Methods ==========
    
    /**
     * Check if schedule has available slots
     */
    public function hasAvailableSlots()
    {
        return $this->available_slots > $this->booked_slots && $this->status === 'available';
    }

    /**
     * Get remaining available slots
     */
    public function getAvailableSlotsCount()
    {
        return $this->available_slots - $this->booked_slots;
    }

    /**
     * Book a slot
     */
    public function bookSlot()
    {
        if ($this->hasAvailableSlots()) {
            $this->increment('booked_slots');
            return true;
        }
        return false;
    }

    /**
     * Cancel a booked slot
     */
    public function cancelSlot()
    {
        if ($this->booked_slots > 0) {
            $this->decrement('booked_slots');
            return true;
        }
        return false;
    }
}

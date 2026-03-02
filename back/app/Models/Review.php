<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Review Model
 * Represents patient reviews for doctors
 */
class Review extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_id',
        'rating',
        'comment',
        'status',
    ];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ========== Relationships ==========
    
    /**
     * Get the patient who wrote the review
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor being reviewed
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the associated appointment
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    // ========== Scopes ==========
    
    /**
     * Scope: Get approved reviews
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: Get pending reviews
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Get reviews for a doctor
     */
    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId)->approved();
    }

    /**
     * Scope: Get 5-star reviews
     */
    public function scopeFiveStar($query)
    {
        return $query->where('rating', 5);
    }

    /**
     * Scope: Get reviews by rating
     */
    public function scopeByRating($query, $rating)
    {
        return $query->where('rating', $rating);
    }

    // ========== Methods ==========
    
    /**
     * Approve the review
     */
    public function approve()
    {
        $this->update(['status' => 'approved']);
        return $this;
    }

    /**
     * Reject the review
     */
    public function reject()
    {
        $this->update(['status' => 'rejected']);
        return $this;
    }

    /**
     * Get star rating as HTML
     */
    public function getStarRating()
    {
        return str_repeat('★', $this->rating) . str_repeat('☆', 5 - $this->rating);
    }
}

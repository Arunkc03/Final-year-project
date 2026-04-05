<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Doctor extends Model
{
    protected $fillable = [
        'user_id',
        'hospital_id',
        'department_id',
        'license_number',
        'specialization',
        'qualification',
        'experience_years',
        'consultation_fee',
        'daily_patient_limit',
        'bio',
        'image',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'experience_years' => 'integer',
        'consultation_fee' => 'decimal:2',
        'daily_patient_limit' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['name', 'email', 'identifier'];

    // Accessors
    public function getNameAttribute()
    {
        return $this->user?->name;
    }

    public function getEmailAttribute()
    {
        return $this->user?->email;
    }

    public function getIdentifierAttribute()
    {
        return $this->user?->identifier;
    }

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_id', 'user_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id', 'user_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'doctor_id', 'user_id');
    }
}

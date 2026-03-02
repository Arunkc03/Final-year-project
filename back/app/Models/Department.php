<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Department Model
 * Represents hospital departments
 */
class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'hospital_id',
        'name',
        'slug',
        'description',
        'head_doctor',
        'total_beds',
        'available_beds',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ========== Relationships ==========
    
    /**
     * Get the hospital that owns this department
     */
    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    /**
     * Get all doctors in this department
     */
    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    /**
     * Get all schedules for this department
     */
    public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class);
    }

    /**
     * Get all appointments for this department
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    // ========== Scopes ==========
    
    /**
     * Scope: Get active departments
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Get inactive departments
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    // ========== Accessors/Mutators ==========
    
    /**
     * Automatically generate slug from name
     */
    public function setNameAttribute($value)
    {
        $this->attributes['name'] = $value;
        if (empty($this->slug)) {
            $this->attributes['slug'] = \Illuminate\Support\Str::slug($value);
        }
    }
}

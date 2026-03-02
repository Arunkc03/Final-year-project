<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hospital extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'admin_email',
        'description',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'logo',
        'image',
        'status',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function admin()
    {
        // relation by admin email stored on hospitals
        return $this->hasOne(User::class, 'email', 'admin_email');
    }

    public function doctors()
    {
        return $this->users()->where('role', 'doctor');
    }

    public function patients()
    {
        return $this->users()->where('role', 'patient');
    }

    public function admins()
    {
        return $this->users()->where('role', 'admin');
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    // ========== New Relationships ==========

    /**
     * Get all departments in this hospital
     */
    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get all appointments in this hospital
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get all doctor schedules in this hospital
     */
    public function doctorSchedules()
    {
        return $this->hasManyThrough(
            DoctorSchedule::class,
            Department::class,
            'hospital_id',
            'department_id'
        );
    }

    // ========== Scopes ==========

    /**
     * Scope: Get active hospitals
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Get inactive hospitals
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope: Get hospitals by city
     */
    public function scopeByCity($query, $city)
    {
        return $query->where('city', $city);
    }

    // ========== Methods ==========

    /**
     * Get hospital statistics
     */
    public function getStatistics()
    {
        return [
            'total_doctors' => $this->doctors()->count(),
            'total_patients' => $this->patients()->count(),
            'total_departments' => $this->departments()->count(),
            'total_appointments' => $this->appointments()->count(),
            'pending_appointments' => $this->appointments()->pending()->count(),
            'completed_appointments' => $this->appointments()->completed()->count(),
        ];
    }

    /**
     * Get hospital full address
     */
    public function getFullAddress()
    {
        return implode(', ', array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]));
    }
}

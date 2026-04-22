<?php


namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Hospital;
use Carbon\Carbon;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'hospital_id',
        'identifier',
        'avatar',
        'phone',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'state',
        'postal_code',
        'last_login_at',
        'google_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    public function hospital()
    {
        return $this->belongsTo(Hospital::class);
    }

    public function doctor()
    {
        return $this->hasOne(Doctor::class);
    }


    public function reports()
    {
        return $this->hasMany(Report::class, 'patient_id');
    }

    public function isAdmin()
    {
        return $this->role === 'admin' || $this->role === 'super_admin';
    }

    public function isSuperAdmin()
    {
        return $this->role === 'super_admin';
    }

    public function isDoctor()
    {
        return $this->role === 'doctor';
    }

    public function isPatient()
    {
        return $this->role === 'patient';
    }

    public function requiresHospitalAccess()
    {
        return in_array($this->role, ['doctor', 'admin'], true);
    }

    public function hasAccessibleHospital()
    {
        if (!$this->requiresHospitalAccess()) {
            return true;
        }

        if (!$this->hospital_id) {
            return false;
        }

        if ($this->relationLoaded('hospital')) {
            return $this->hospital !== null;
        }

        return Hospital::query()->whereKey($this->hospital_id)->exists();
    }

    // ========== Relationships ==========

    /**
     * Get appointments for this user (patient or doctor)
     */
    public function appointments()
    {
        if ($this->isDoctor()) {
            return $this->hasMany(Appointment::class, 'doctor_id');
        }
        return $this->hasMany(Appointment::class, 'user_id');
    }

    /**
     * Get schedules if doctor
     */
    public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_id');
    }

    /**
     * Get department if doctor
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get notifications for this user
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get unread notifications count
     */
    public function unreadNotificationsCount()
    {
        return $this->notifications()->unread()->count();
    }

    /**
     * Get reviews written by patient
     */
    public function reviewsWritten()
    {
        return $this->hasMany(Review::class, 'patient_id');
    }

    /**
     * Get reviews about this doctor
     */
    public function reviewsReceived()
    {
        if ($this->isDoctor()) {
            return $this->hasMany(Review::class, 'doctor_id');
        }
        return collect();
    }

    /**
     * Get average rating for doctor
     */
    public function getAverageRating()
    {
        if (!$this->isDoctor()) {
            return null;
        }
        return $this->reviewsReceived()->approved()->avg('rating') ?? 0;
    }

    /**
     * Get total reviews for doctor
     */
    public function getTotalReviews()
    {
        if (!$this->isDoctor()) {
            return 0;
        }
        return $this->reviewsReceived()->approved()->count();
    }

    /**
     * Get payments made by this user
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get reports for patient or doctor
     */
    public function doctorReports()
    {
        if ($this->isDoctor()) {
            return $this->hasMany(Report::class, 'doctor_id');
        }
        return collect();
    }

    /**
     * Get audit logs for user actions
     */
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // ========== Scopes ==========

    /**
     * Scope: Get active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Get inactive users
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope: Get users by role
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope: Get doctors
     */
    public function scopeDoctors($query)
    {
        return $query->where('role', 'doctor');
    }

    /**
     * Scope: Get patients
     */
    public function scopePatients($query)
    {
        return $query->where('role', 'patient');
    }

    /**
     * Scope: Get admins
     */
    public function scopeAdmins($query)
    {
        return $query->whereIn('role', ['admin', 'super_admin']);
    }

    // ========== Methods ==========

    /**
     * Update last login timestamp
     */
    public function updateLastLogin()
    {
        $this->update(['last_login_at' => now()]);
        return $this;
    }

    /**
     * Get user full information
     */
    public function getFullInfo()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'hospital' => $this->hospital,
            'department' => $this->department,
            'is_active' => $this->is_active,
            'average_rating' => $this->isDoctor() ? $this->getAverageRating() : null,
            'total_reviews' => $this->isDoctor() ? $this->getTotalReviews() : null,
        ];
    }
}
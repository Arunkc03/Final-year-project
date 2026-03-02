<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Payment Model
 * Represents appointment payment transactions
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'user_id',
        'amount',
        'status',
        'payment_method',
        'transaction_id',
        'description',
        'paid_at',
        // Khalti payment gateway fields
        'khalti_pidx',
        'khalti_status',
        'khalti_payment_url',
        'khalti_fee',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'khalti_fee' => 'decimal:2',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========== Relationships ==========
    
    /**
     * Get the appointment this payment is for
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the user who made the payment
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ========== Scopes ==========
    
    /**
     * Scope: Get completed payments
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope: Get pending payments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Get failed payments
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope: Get payments for a user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Get payments by method
     */
    public function scopeByMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    /**
     * Scope: Get Khalti payments
     */
    public function scopeKhalti($query)
    {
        return $query->where('payment_method', 'khalti');
    }

    /**
     * Scope: Get payments by Khalti PIDX
     */
    public function scopeByKhaltiPidx($query, $pidx)
    {
        return $query->where('khalti_pidx', $pidx);
    }

    // ========== Methods ==========
    
    /**
     * Mark payment as completed
     */
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'paid_at' => now(),
        ]);
        
        // Update appointment payment status
        if ($this->appointment) {
            $this->appointment->update(['payment_status' => 'completed']);
        }
        
        return $this;
    }

    /**
     * Mark payment as failed
     */
    public function markAsFailed()
    {
        $this->update(['status' => 'failed']);
        return $this;
    }

    /**
     * Refund the payment
     */
    public function refund()
    {
        $this->update([
            'status' => 'refunded',
            'paid_at' => null,
        ]);
        
        if ($this->appointment) {
            $this->appointment->update(['payment_status' => 'refunded']);
        }
        
        return $this;
    }

    /**
     * Check if payment is completed
     */
    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    /**
     * Check if this is a Khalti payment
     */
    public function isKhaltiPayment()
    {
        return $this->payment_method === 'khalti';
    }

    /**
     * Check if Khalti payment is pending verification
     */
    public function isKhaltiPending()
    {
        return $this->isKhaltiPayment() && 
               $this->khalti_pidx && 
               $this->status === 'pending';
    }

    /**
     * Get formatted amount with currency
     */
    public function getFormattedAmountAttribute()
    {
        return 'NPR ' . number_format($this->amount, 2);
    }
}

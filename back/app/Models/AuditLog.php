<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * AuditLog Model
 * Represents system audit trail for tracking actions
 */
class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'action',
        'model',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========== Relationships ==========
    
    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ========== Scopes ==========
    
    /**
     * Scope: Get logs for a specific action
     */
    public function scopeForAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Get logs for a specific model
     */
    public function scopeForModel($query, $model)
    {
        return $query->where('model', $model);
    }

    /**
     * Scope: Get logs for a user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Get recent logs
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days))->orderBy('created_at', 'desc');
    }

    // ========== Methods ==========
    
    /**
     * Create an audit log entry
     */
    public static function log($action, $model, $modelId = null, $oldValues = null, $newValues = null, $description = null)
    {
        return static::create([
            'user_id' => auth()->id() ?? null,
            'action' => $action,
            'model' => class_basename($model),
            'model_id' => $modelId ?? ($model->id ?? null),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'description' => $description,
        ]);
    }

    /**
     * Get human-readable description of changes
     */
    public function getChangeSummary()
    {
        if (!$this->old_values || !$this->new_values) {
            return 'No changes recorded';
        }

        $changes = [];
        foreach ($this->new_values as $key => $value) {
            if (isset($this->old_values[$key]) && $this->old_values[$key] !== $value) {
                $changes[] = "$key: {$this->old_values[$key]} → $value";
            }
        }

        return implode(', ', $changes) ?: 'No changes';
    }
}

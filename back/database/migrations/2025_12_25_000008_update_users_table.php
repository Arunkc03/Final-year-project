<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates users table with additional fields for doctor and patient info
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable();
            }
            if (!Schema::hasColumn('users', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable();
            }
            if (!Schema::hasColumn('users', 'gender')) {
                $table->enum('gender', ['male', 'female', 'other'])->nullable();
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->text('address')->nullable();
            }
            if (!Schema::hasColumn('users', 'city')) {
                $table->string('city')->nullable();
            }
            if (!Schema::hasColumn('users', 'state')) {
                $table->string('state')->nullable();
            }
            if (!Schema::hasColumn('users', 'postal_code')) {
                $table->string('postal_code')->nullable();
            }
            // Doctor-specific fields
            if (!Schema::hasColumn('users', 'license_number')) {
                $table->string('license_number')->nullable();
            }
            if (!Schema::hasColumn('users', 'specialization')) {
                $table->string('specialization')->nullable();
            }
            if (!Schema::hasColumn('users', 'qualification')) {
                $table->string('qualification')->nullable();
            }
            if (!Schema::hasColumn('users', 'experience_years')) {
                $table->integer('experience_years')->default(0);
            }
            if (!Schema::hasColumn('users', 'consultation_fee')) {
                $table->decimal('consultation_fee', 10, 2)->default(0);
            }
            if (!Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable();
            }
            if (!Schema::hasColumn('users', 'department_id')) {
                $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['phone', 'avatar', 'date_of_birth', 'gender', 'address', 'city', 'state', 
                       'postal_code', 'license_number', 'specialization', 'qualification', 
                       'experience_years', 'consultation_fee', 'bio', 'is_active', 'last_login_at'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
            
            if (Schema::hasColumn('users', 'department_id')) {
                $table->dropForeign(['department_id']);
                $table->dropColumn('department_id');
            }
        });
    }
};

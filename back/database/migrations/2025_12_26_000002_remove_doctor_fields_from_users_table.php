<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove doctor-specific columns from users table (now in doctors table)
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop foreign key first
            try {
                $table->dropForeign(['department_id']);
            } catch (\Exception $e) {
                // Foreign key may not exist
            }
        });

        Schema::table('users', function (Blueprint $table) {
            // Only remove doctor-specific fields, keep common profile fields
            $columns = ['license_number', 'specialization', 'qualification', 
                       'experience_years', 'consultation_fee', 'bio', 'department_id'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is for cleanup, rollback is not needed
    }
};

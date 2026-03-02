<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix doctor_id foreign key constraint to point to doctors table instead of users
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Drop the existing foreign key if it exists
            try {
                $table->dropForeign('appointments_doctor_id_foreign');
            } catch (\Exception $e) {
                // Foreign key might not exist, continue
            }
        });

        // Recreate the foreign key pointing to doctors table
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'doctor_id')) {
                // Add the correct foreign key constraint
                $table->foreign('doctor_id')
                    ->references('id')
                    ->on('doctors')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            try {
                $table->dropForeign('appointments_doctor_id_foreign');
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        });
    }
};

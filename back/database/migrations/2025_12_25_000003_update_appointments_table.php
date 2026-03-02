<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates appointments table with additional fields for comprehensive appointment management
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('appointments', 'doctor_id')) {
                $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');
            }
            if (!Schema::hasColumn('appointments', 'department_id')) {
                $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            }
            if (!Schema::hasColumn('appointments', 'time')) {
                $table->time('time')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'payment_status')) {
                $table->enum('payment_status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            }
            if (!Schema::hasColumn('appointments', 'payment_amount')) {
                $table->decimal('payment_amount', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('appointments', 'reason')) {
                $table->text('reason')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'confirmed_at')) {
                $table->timestamp('confirmed_at')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'completed_at')) {
                $table->timestamp('completed_at')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable();
            }
            if (!Schema::hasColumn('appointments', 'cancellation_reason')) {
                $table->text('cancellation_reason')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'doctor_id')) {
                $table->dropForeign(['doctor_id']);
                $table->dropColumn('doctor_id');
            }
            if (Schema::hasColumn('appointments', 'department_id')) {
                $table->dropForeign(['department_id']);
                $table->dropColumn('department_id');
            }
            if (Schema::hasColumn('appointments', 'time')) {
                $table->dropColumn('time');
            }
            if (Schema::hasColumn('appointments', 'payment_status')) {
                $table->dropColumn('payment_status');
            }
            if (Schema::hasColumn('appointments', 'payment_amount')) {
                $table->dropColumn('payment_amount');
            }
            if (Schema::hasColumn('appointments', 'reason')) {
                $table->dropColumn('reason');
            }
            if (Schema::hasColumn('appointments', 'confirmed_at')) {
                $table->dropColumn('confirmed_at');
            }
            if (Schema::hasColumn('appointments', 'completed_at')) {
                $table->dropColumn('completed_at');
            }
            if (Schema::hasColumn('appointments', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }
            if (Schema::hasColumn('appointments', 'cancellation_reason')) {
                $table->dropColumn('cancellation_reason');
            }
        });
    }
};

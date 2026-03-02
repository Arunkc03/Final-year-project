<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds Khalti payment gateway fields to payments table
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Khalti-specific fields
            $table->string('khalti_pidx')->nullable()->after('transaction_id');
            $table->string('khalti_status')->nullable()->after('khalti_pidx');
            $table->string('khalti_payment_url')->nullable()->after('khalti_status');
            $table->decimal('khalti_fee', 10, 2)->nullable()->after('khalti_payment_url');
            
            // Index for faster lookups
            $table->index('khalti_pidx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['khalti_pidx']);
            $table->dropColumn([
                'khalti_pidx',
                'khalti_status',
                'khalti_payment_url',
                'khalti_fee',
            ]);
        });
    }
};

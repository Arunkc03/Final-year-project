<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('hospitals', 'slug')) {
                $table->string('slug')->unique()->after('name');
            }
            if (!Schema::hasColumn('hospitals', 'description')) {
                $table->text('description')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('hospitals', 'email')) {
                $table->string('email')->unique()->nullable()->after('description');
            }
            if (!Schema::hasColumn('hospitals', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('hospitals', 'city')) {
                $table->string('city')->nullable()->after('address');
            }
            if (!Schema::hasColumn('hospitals', 'state')) {
                $table->string('state')->nullable()->after('city');
            }
            if (!Schema::hasColumn('hospitals', 'country')) {
                $table->string('country')->nullable()->after('state');
            }
            if (!Schema::hasColumn('hospitals', 'postal_code')) {
                $table->string('postal_code')->nullable()->after('country');
            }
            if (!Schema::hasColumn('hospitals', 'logo')) {
                $table->string('logo')->nullable()->after('postal_code');
            }
            if (!Schema::hasColumn('hospitals', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('logo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'description',
                'email',
                'phone',
                'city',
                'state',
                'country',
                'postal_code',
                'logo',
                'status'
            ]);
        });
    }
};

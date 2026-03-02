<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            // Drop foreign key and admin_id if exists
            if (Schema::hasColumn('hospitals', 'admin_id')) {
                try {
                    $table->dropForeign(['admin_id']);
                } catch (\Exception $e) {
                    // ignore if foreign key not found
                }
                $table->dropColumn('admin_id');
            }

            if (!Schema::hasColumn('hospitals', 'admin_email')) {
                $table->string('admin_email')->nullable()->after('id');
                $table->unique(['admin_email']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('hospitals', function (Blueprint $table) {
            if (Schema::hasColumn('hospitals', 'admin_email')) {
                $table->dropUnique(['admin_email']);
                $table->dropColumn('admin_email');
            }
            if (!Schema::hasColumn('hospitals', 'admin_id')) {
                $table->unsignedBigInteger('admin_id')->nullable()->after('id');
                $table->foreign('admin_id')->references('id')->on('users')->onDelete('set null');
            }
        });
    }
};

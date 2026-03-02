<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'vendor_id')) {
            $fk = DB::select(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
                 WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'users' 
                   AND COLUMN_NAME = 'vendor_id' 
                   AND REFERENCED_TABLE_NAME IS NOT NULL"
            );

            if (!empty($fk)) {
                $constraintName = $fk[0]->CONSTRAINT_NAME;
                Schema::table('users', function (Blueprint $table) use ($constraintName) {
                    $table->dropForeign($constraintName);
                });
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('vendor_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'vendor_id')) {
                $table->unsignedBigInteger('vendor_id')->nullable()->after('role');
            }
        });
    }
};

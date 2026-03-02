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
        // add hospital_id column
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('hospital_id')->nullable()->after('role');
        });

        // copy vendor_id values into hospital_id
        DB::table('users')->whereNotNull('vendor_id')->update(['hospital_id' => DB::raw('vendor_id')]);

        // add foreign key to hospitals
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('hospital_id')->references('id')->on('hospitals')->onDelete('cascade');
        });

        // drop vendor_id foreign key and column if exists
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'vendor_id')) {
                // drop foreign if exists - safe DB statement
                try {
                    $table->dropForeign(['vendor_id']);
                } catch (\Throwable $e) {
                    // ignore if not exists
                }
                $table->dropColumn('vendor_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('vendor_id')->nullable()->after('role');
        });

        DB::table('users')->whereNotNull('hospital_id')->update(['vendor_id' => DB::raw('hospital_id')]);

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'hospital_id')) {
                try {
                    $table->dropForeign(['hospital_id']);
                } catch (\Throwable $e) {
                }
                $table->dropColumn('hospital_id');
            }
        });
    }
};

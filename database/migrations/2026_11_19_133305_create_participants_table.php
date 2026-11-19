<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('institution_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('grade')->comment('1-9');
            $table->string('level', 16);
            $table->string('school_name');
            $table->string('school_city')->nullable();
            $table->timestamps();

            $table->index(['owner_id', 'name', 'grade']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};

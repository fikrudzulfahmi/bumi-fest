<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judge_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('judge_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            // AC-F10-03: satu pasangan juri–lomba hanya boleh ada sekali.
            $table->unique(['judge_id', 'competition_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judge_assignments');
    }
};

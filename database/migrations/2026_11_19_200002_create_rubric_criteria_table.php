<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rubric_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('weight'); // bobot bulat ≥ 1 (AC-F10-04)
            $table->unsignedInteger('max_score')->default(100);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['competition_id', 'sort']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rubric_criteria');
    }
};

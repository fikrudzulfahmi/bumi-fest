<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('score_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('judge_id')->constrained('users')->cascadeOnDelete();
            $table->string('note')->nullable();
            $table->string('status', 32)->default('draft');
            $table->decimal('total', 5, 2)->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            // AC-F11: satu juri satu lembar nilai per entri.
            $table->unique(['registration_id', 'judge_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('score_sheets');
    }
};

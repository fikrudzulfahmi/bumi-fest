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
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            $table->string('level', 16);
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('category', 16);
            $table->unsignedInteger('fee');
            $table->unsignedInteger('quota')->nullable();
            $table->unsignedTinyInteger('team_min')->nullable();
            $table->unsignedTinyInteger('team_max')->nullable();
            $table->timestamp('opens_at');
            $table->timestamp('closes_at');
            $table->string('status', 16)->default('draft');
            $table->string('rules_pdf_path')->nullable();
            $table->json('requirements')->nullable();
            $table->json('required_documents')->nullable();
            $table->string('submission_mode', 16)->default('none');
            $table->json('submission_mimes')->nullable();
            $table->unsignedSmallInteger('submission_max_mb')->nullable();
            $table->timestamp('results_published_at')->nullable();
            $table->timestamps();

            $table->index(['level', 'status']);
            $table->index(['status', 'opens_at', 'closes_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32); // CertificateType: winner | participation
            $table->string('image_path');
            $table->json('layout');
            $table->timestamps();

            $table->unique(['competition_id', 'type']);
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained()->cascadeOnDelete();
            $table->string('type', 32); // CertificateType: winner | participation
            $table->unsignedTinyInteger('placement')->nullable(); // 1-3 untuk winner
            $table->string('number')->unique();
            $table->string('verification_code', 10)->unique();
            $table->string('file_path')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(['registration_id', 'participant_id']);
            $table->index(['registration_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('certificate_templates');
    }
};

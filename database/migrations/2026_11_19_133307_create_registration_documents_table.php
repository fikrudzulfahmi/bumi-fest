<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registration_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 32);
            $table->string('path', 255);
            $table->string('original_name', 255);
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();

            $table->index(['registration_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registration_documents');
    }
};

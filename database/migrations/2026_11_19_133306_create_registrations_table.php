<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 32)->default('draft');
            $table->string('team_name')->nullable();
            $table->unsignedInteger('fee')->default(0);
            $table->string('submission_path')->nullable();
            $table->string('submission_url')->nullable();
            $table->string('submission_name')->nullable();
            $table->timestamp('requirements_accepted_at')->nullable();
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->unsignedTinyInteger('placement')->nullable();
            $table->timestamps();

            $table->index(['competition_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};

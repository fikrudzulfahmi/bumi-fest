<?php

namespace App\Http\Requests;

use App\Enums\CompetitionCategory;
use App\Enums\Level;
use App\Enums\SubmissionMode;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreCompetitionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'level' => ['required', new Enum(Level::class)],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:competitions,slug'],
            'description' => ['required', 'string'],
            'category' => ['required', new Enum(CompetitionCategory::class)],
            'fee' => ['required', 'integer', 'min:0'],
            'quota' => ['nullable', 'integer', 'min:1'],
            'team_min' => ['nullable', 'integer', 'min:1'],
            'team_max' => ['nullable', 'integer', 'min:1', 'gte:team_min'],
            'opens_at' => ['required', 'date', 'before:closes_at'],
            'closes_at' => ['required', 'date', 'after:opens_at'],
            'rules_pdf_path' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['string'],
            'required_documents' => ['nullable', 'array'],
            'required_documents.*' => ['string'],
            'submission_mode' => ['required', new Enum(SubmissionMode::class)],
            'submission_mimes' => ['nullable', 'array'],
            'submission_mimes.*' => ['string'],
            'submission_max_mb' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'level.required' => 'Jenjang harus dipilih.',
            'level.enum' => 'Jenjang tidak valid.',
            'name.required' => 'Nama lomba harus diisi.',
            'slug.unique' => 'Slug sudah digunakan.',
            'category.required' => 'Kategori harus dipilih.',
            'fee.required' => 'Biaya pendaftaran harus diisi.',
            'fee.min' => 'Biaya tidak boleh negatif.',
            'quota.min' => 'Kuota minimal 1.',
            'team_min.min' => 'Minimum anggota minimal 1.',
            'team_max.min' => 'Maksimum anggota minimal 1.',
            'opens_at.required' => 'Tanggal dibuka harus diisi.',
            'opens_at.before' => 'Tanggal dibuka harus sebelum tanggal ditutup.',
            'closes_at.required' => 'Tanggal ditutup harus diisi.',
            'closes_at.after' => 'Tanggal ditutup harus setelah tanggal dibuka.',
            'rules_pdf_path.mimes' => 'File juknis harus PDF.',
            'rules_pdf_path.max' => 'File juknis tidak boleh lebih dari 10 MB.',
            'submission_mode.required' => 'Mode pengumpulan harus dipilih.',
        ];
    }
}

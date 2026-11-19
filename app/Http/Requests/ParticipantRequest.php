<?php

namespace App\Http\Requests;

use App\Enums\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ParticipantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return match ($this->user()->role) {
            Role::Participant, Role::Institution => true,
            default => false,
        };
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // BR-01: jenjang diturunkan dari kelas, tidak dari input
        return [
            'name' => ['required', 'string', 'max:150'],
            'grade' => ['required', 'integer', 'min:1', 'max:9'],
            'school_name' => ['required', 'string', 'max:200'],
            'school_city' => ['nullable', 'string', 'max:100'],
            'institution_id' => ['nullable', 'integer', 'exists:institutions,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama siswa wajib diisi.',
            'grade.required' => 'Kelas wajib diisi.',
            'grade.integer' => 'Kelas harus berupa angka.',
            'grade.min' => 'Kelas minimal 1.',
            'grade.max' => 'Kelas maksimal 9.',
            'school_name.required' => 'Nama sekolah wajib diisi.',
            'institution_id.exists' => 'Lembaga tidak ditemukan.',
        ];
    }
}

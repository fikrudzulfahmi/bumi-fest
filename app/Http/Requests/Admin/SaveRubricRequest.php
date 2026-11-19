<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SaveRubricRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // rute sudah dibatasi middleware role:admin
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'criteria' => ['required', 'array', 'min:1', 'max:30'],
            'criteria.*.name' => ['required', 'string', 'max:120'],
            'criteria.*.weight' => ['required', 'integer', 'min:1', 'max:100'],
            'criteria.*.max_score' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'criteria.required' => 'Rubrik harus memiliki minimal satu kriteria.',
            'criteria.min' => 'Rubrik harus memiliki minimal satu kriteria.',
            'criteria.*.name.required' => 'Nama kriteria wajib diisi.',
            'criteria.*.weight.required' => 'Bobot kriteria wajib diisi.',
            'criteria.*.weight.integer' => 'Bobot kriteria harus bilangan bulat.',
            'criteria.*.weight.min' => 'Bobot kriteria minimal 1.',
            'criteria.*.max_score.required' => 'Nilai maksimal wajib diisi.',
            'criteria.*.max_score.min' => 'Nilai maksimal minimal 1.',
        ];
    }
}

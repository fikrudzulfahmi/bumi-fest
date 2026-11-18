<?php

namespace App\Http\Requests;

use App\Enums\Level;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class AnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'level' => ['nullable', new Enum(Level::class)],
            'title' => ['required', 'string', 'max:200'],
            'body' => ['required', 'string'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'level.enum' => 'Jenjang tidak valid.',
            'title.required' => 'Judul pengumuman harus diisi.',
            'title.max' => 'Judul maksimal 200 karakter.',
            'body.required' => 'Isi pengumuman harus diisi.',
            'published_at.date' => 'Tanggal terbit tidak valid.',
        ];
    }
}

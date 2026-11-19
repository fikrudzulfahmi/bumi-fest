<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJudgeRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'whatsapp' => ['nullable', 'string', 'max:20', 'regex:/^(?:\\+?62|0)8[1-9][0-9]{6,11}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama juri wajib diisi.',
            'email.required' => 'Email juri wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah dipakai akun lain.',
            'whatsapp.regex' => 'Nomor WhatsApp tidak valid (contoh: 08123456789).',
        ];
    }
}

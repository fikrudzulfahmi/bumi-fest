<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Guest only, checked via middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Common fields
            'type' => 'required|in:participant,institution',
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'whatsapp' => ['required', 'string', 'regex:/^(\+62|62|0)[0-9]{9,13}$/'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'privacy_consent' => 'required|accepted',

            // Institution fields (conditional)
            'institution_name' => 'required_if:type,institution|string|max:255',
            'npsn' => 'required_if:type,institution|string|size:8|unique:institutions,npsn',
            'city' => 'required_if:type,institution|string|max:255',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa teks.',
            'name.max' => 'Nama maksimal 255 karakter.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah terdaftar.',
            'whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'whatsapp.regex' => 'Nomor WhatsApp harus dimulai dengan 0 atau +62.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'privacy_consent.required' => 'Persetujuan privasi wajib disetujui.',
            'privacy_consent.accepted' => 'Persetujuan privasi harus dicentang.',
            'institution_name.required_if' => 'Nama sekolah wajib diisi untuk lembaga.',
            'npsn.required_if' => 'NPSN wajib diisi untuk lembaga.',
            'npsn.size' => 'NPSN harus terdiri dari 8 digit.',
            'npsn.unique' => 'NPSN sudah terdaftar.',
            'city.required_if' => 'Kota wajib diisi untuk lembaga.',
        ];
    }

    /**
     * Normalize WhatsApp to 62... format.
     * AC-F01-06: 0812-3456-7890 → 6281234567890
     */
    public function normalizeWhatsapp(string $whatsapp): string
    {
        // Remove non-digits
        $cleaned = preg_replace('/[^0-9]/', '', $whatsapp);

        // If starts with 0, replace with 62
        if (str_starts_with($cleaned, '0')) {
            $cleaned = '62'.substr($cleaned, 1);
        }
        // If already has 62, keep it
        elseif (! str_starts_with($cleaned, '62')) {
            $cleaned = '62'.$cleaned;
        }

        return $cleaned;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize WhatsApp before validation
        $this->merge([
            'whatsapp' => $this->normalizeWhatsapp($this->input('whatsapp', '')),
        ]);

        // Reject any 'role' in the request (AC-F01-03)
        $this->request->remove('role');
    }
}

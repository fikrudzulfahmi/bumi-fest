<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'event_name' => ['required', 'string', 'max:150'],
            'contact_whatsapp' => ['required', 'string', 'max:20', 'regex:/^62[0-9]{8,14}$/'],
            'contact_email' => ['required', 'email', 'max:150'],
            'payment_due_hours' => ['required', 'integer', 'min:1', 'max:720'],
            'max_competitions_per_participant' => ['nullable', 'integer', 'min:1', 'max:100'],
            'import_max_rows' => ['required', 'integer', 'min:1', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'event_name.required' => 'Nama acara harus diisi.',
            'event_name.max' => 'Nama acara maksimal 150 karakter.',
            'contact_whatsapp.required' => 'Nomor WhatsApp harus diisi.',
            'contact_whatsapp.regex' => 'Nomor WhatsApp harus diawali 62 dan berisi 8–14 angka.',
            'contact_email.required' => 'Email kontak harus diisi.',
            'contact_email.email' => 'Format email tidak valid.',
            'payment_due_hours.required' => 'Batas waktu pembayaran harus diisi.',
            'payment_due_hours.min' => 'Batas waktu pembayaran minimal 1 jam.',
            'payment_due_hours.max' => 'Batas waktu pembayaran maksimal 720 jam.',
            'max_competitions_per_participant.min' => 'Batas lomba minimal 1.',
            'max_competitions_per_participant.max' => 'Batas lomba maksimal 100.',
            'import_max_rows.required' => 'Batas baris impor harus diisi.',
            'import_max_rows.min' => 'Batas baris impor minimal 1.',
            'import_max_rows.max' => 'Batas baris impor maksimal 5000.',
        ];
    }
}

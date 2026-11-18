<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BankAccountRequest extends FormRequest
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
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:32', 'regex:/^[0-9-]+$/'],
            'account_holder' => ['required', 'string', 'max:150'],
            'is_active' => ['boolean'],
            'sort' => ['nullable', 'integer', 'min:0', 'max:999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'bank_name.required' => 'Nama bank harus diisi.',
            'bank_name.max' => 'Nama bank maksimal 100 karakter.',
            'account_number.required' => 'Nomor rekening harus diisi.',
            'account_number.regex' => 'Nomor rekening hanya boleh berisi angka dan tanda hubung.',
            'account_number.max' => 'Nomor rekening maksimal 32 karakter.',
            'account_holder.required' => 'Atas nama harus diisi.',
            'account_holder.max' => 'Atas nama maksimal 150 karakter.',
            'sort.integer' => 'Urutan harus berupa angka.',
            'sort.min' => 'Urutan tidak boleh negatif.',
            'sort.max' => 'Urutan maksimal 999.',
        ];
    }
}

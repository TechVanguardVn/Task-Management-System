<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', 'in:TODO,IN_PROGRESS,DONE'],
            'priority' => ['sometimes', 'required', 'string', 'in:LOW,MEDIUM,HIGH'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:TODO,IN_PROGRESS,DONE'],
            'priority' => ['required', 'string', 'in:LOW,MEDIUM,HIGH'],
            'due_date' => ['nullable', 'date'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: "RegisterRequest",
    title: "Register Request",
    required: ["name", "email", "password", "password_confirmation"]
)]
class RegisterRequest extends FormRequest
{
    #[OA\Property(example: "Nguyen Van A")]
    public string $name;

    #[OA\Property(example: "user@example.com")]
    public string $email;

    #[OA\Property(example: "Secret123@")]
    public string $password;

    #[OA\Property(example: "Secret123@")]
    public string $password_confirmation;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
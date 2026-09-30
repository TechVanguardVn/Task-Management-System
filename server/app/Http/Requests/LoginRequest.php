<?php 
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: "LoginRequest",
    title: "Login Request",
    required: ["email", "password"]
)]
class LoginRequest extends FormRequest
{
    #[OA\Property(example: "user@example.com")]
    public string $email;

    #[OA\Property(example: "Secret123@")]
    public string $password;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ];
    }
}
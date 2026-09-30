<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        protected UserRepository $userRepo
    ) {}

    public function register(array $data): User
    {
        $user = $this->userRepo->create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Đăng nhập luôn cho user sau khi đăng ký thành công
        Auth::login($user);
        request()->session()->regenerate();

        return $user;
    }

    public function login(array $credentials): User
    {
        // 1. Xác thực thông tin qua Guard Session mặc định của Laravel
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Thông tin đăng nhập không chính xác.'],
            ]);
        }

        // 2. BẮT BUỘC: Tạo lại session ID để set Cookie vào trình duyệt và chống Session Fixation
        request()->session()->regenerate();

        /** @var User */
        return Auth::user();
    }

    public function logout(): void
    {
        // 1. Huỷ phiên đăng nhập
        Auth::guard('web')->logout();

        // 2. Huỷ bỏ dữ liệu session hiện tại
        request()->session()->invalidate();

        // 3. Tạo lại CSRF Token mới
        request()->session()->regenerateToken();
    }
}
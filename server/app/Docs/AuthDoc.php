<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

#[OA\Tag(name: "Auth", description: "Quản lý xác thực người dùng")]
trait AuthDoc
{
    #[OA\Post(
        path: "/auth/register",
        summary: "Đăng ký tài khoản",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: "#/components/schemas/RegisterRequest")
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Đăng ký thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "user", type: "object"),
                        new OA\Property(property: "access_token", type: "string", example: "1|laravelsanctumtokenstring..."),
                        new OA\Property(property: "token_type", type: "string", example: "Bearer")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Dữ liệu không hợp lệ")
        ]
    )]
    public function registerDoc() {}

    #[OA\Post(
        path: "/auth/login",
        summary: "Đăng nhập hệ thống",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: "#/components/schemas/LoginRequest")
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Đăng nhập thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "user", type: "object"),
                        new OA\Property(property: "access_token", type: "string", example: "2|laravelsanctumtokenstring..."),
                        new OA\Property(property: "token_type", type: "string", example: "Bearer")
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Email hoặc mật khẩu sai")
        ]
    )]
    public function loginDoc() {}

    #[OA\Post(
        path: "/auth/logout",
        summary: "Đăng xuất tài khoản",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Đăng xuất thành công",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Đăng xuất thành công")
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]
    public function logoutDoc() {}

    #[OA\Get(
        path: "/auth/user",
        summary: "Lấy thông tin người dùng đang đăng nhập",
        tags: ["Auth"],
        security: [["bearerAuth" => []]], 
        responses: [
            new OA\Response(
                response: 200,
                description: "Thông tin profile user",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "Nguyen Van A"),
                        new OA\Property(property: "email", type: "string", example: "user@example.com")
                    ]
                )
            ),
            new OA\Response(response: 401, description: "Unauthenticated (Chưa đăng nhập)")
        ]
    )]
    public function meDoc() {}
}

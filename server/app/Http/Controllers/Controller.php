<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;
if (!defined('L5_SWAGGER_CONST_HOST')) {
    $appUrl = env('APP_URL', 'http://localhost:8000');
    define('L5_SWAGGER_CONST_HOST', rtrim($appUrl, '/') . '/api');
}

if (!defined('L5_SWAGGER_SERVER_DESCRIPTION')) {
    define('L5_SWAGGER_SERVER_DESCRIPTION', env('APP_ENV') === 'production' ? 'Production API Server' : 'Development API Server');
}
#[
    OA\Info(
        version: "1.0.0",
        title: "Laravel API Documentation",
        description: "Tài liệu RESTful API hệ thống",
        
    ),
    OA\Server(
        url: L5_SWAGGER_CONST_HOST,
        description: L5_SWAGGER_SERVER_DESCRIPTION
    ),
    OA\SecurityScheme(
        securityScheme: "bearerAuth",
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
    )
]
abstract class Controller
{
    // 
    #[OA\Get(
        path: "/health-check",
        summary: "Kiểm tra trạng thái server",
        tags: ["System"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Server hoạt động bình thường",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "status", type: "string", example: "ok")
                    ]
                )
            )
        ]
    )]
    public function healthCheck()
    {
        return response()->json(['status' => 'ok']);
    }
}
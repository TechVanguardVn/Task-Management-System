<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class SystemController extends Controller
{
    public function healthCheck(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'task-management-system',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}

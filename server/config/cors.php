<?php

return [

    /*
     * Cho phép CORS áp dụng cho cả /api/* VÀ /sanctum/csrf-cookie
     */
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    /*
     * KHÔNG ĐƯỢC ĐỂ ['*'] KHI DÙNG COOKIE!
     * Phải điền chính xác Origin của Frontend (kèm cả http:// và port)
     */
    'allowed_origins' => [
        'http://localhost:5173',  
        'http://localhost:3000',  
        'https://blueskydev04.id.vn',      
        'https://www.blueskydev04.id.vn',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     * BẮT BUỘC: true để trình duyệt chịu trao đổi Cookie
     */
    'supports_credentials' => true,

];
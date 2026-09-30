# Kiến trúc Backend (Server)

## 1. Tổng quan

Backend của dự án là một API Laravel, chịu trách nhiệm:
- xác thực người dùng bằng Sanctum
- quản lý task theo user
- validate dữ liệu đầu vào
- chuẩn hóa response trả về client
- cung cấp tài liệu API bằng Swagger/L5-Swagger

Kiến trúc hiện tại theo mô hình phân lớp rõ ràng:
- Route -> Controller -> Service -> Repository -> Model/Database
- Response được chuẩn hóa bằng Resource
- Validation được tách riêng trong Request
- Business logic không nằm trực tiếp trong Controller

## 2. Cấu trúc thư mục

```text
server/
├── app/
│   ├── Docs/
│   │   ├── AuthDoc.php
│   │   └── TaskDoc.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── TaskController.php
│   │   │   └── SystemController.php
│   │   ├── Requests/
│   │   │   ├── LoginRequest.php
│   │   │   ├── RegisterRequest.php
│   │   │   ├── StoreTaskRequest.php
│   │   │   └── UpdateTaskRequest.php
│   │   └── Resources/
│   │       ├── TaskResource.php
│   │       └── UserResource.php
│   ├── Models/
│   │   ├── Task.php
│   │   └── User.php
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Repositories/
│   │   ├── TaskRepository.php
│   │   └── UserRepository.php
│   └── Services/
│       ├── AuthService.php
│       └── TaskService.php
├── routes/
│   ├── api.php
│   ├── console.php
│   └── web.php
├── config/
│   ├── l5-swagger.php
│   └── sanctum.php
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── public/
├── tests/
├── artisan
├── composer.json
├── phpunit.xml
└── README.md
```

## 3. Lớp phía API

### 3.1 Route layer
File:
- `routes/api.php`

Router định nghĩa các endpoint chính:
- `GET /api/health-check`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/user`
- `POST /api/auth/logout`
- `GET /api/tasks`, `POST /api/tasks`, `PUT/PATCH /api/tasks/{id}`, `DELETE /api/tasks/{id}`

Một số endpoint được đặt trong `auth:sanctum` middleware để bắt buộc người dùng đã login trước khi gọi.

### 3.2 Controller layer
File:
- `app/Http/Controllers/AuthController.php`
- `app/Http/Controllers/TaskController.php`

Controller có trách nhiệm:
- nhận HTTP request
- validate request thông qua `Request` object
- gọi Service
- trả response hoặc `JsonResponse`

Controller không nên chứa logic nghiệp vụ phức tạp hay thao tác database trực tiếp.

### 3.3 Service layer
File:
- `app/Services/AuthService.php`
- `app/Services/TaskService.php`

Service chứa business logic, ví dụ:
- đăng ký user
- đăng nhập, logout
- kiểm tra quyền sở hữu task
- thao tác workflow nghiệp vụ

Ví dụ trong `TaskService`:
- `getTasksForUser()` lấy công việc của user hiện tại
- `createTask()` tạo task mới với `user_id`
- `updateTask()` và `deleteTask()` kiểm tra `authorizeTaskAccess()` trước khi cập nhật/xoá

### 3.4 Repository layer
File:
- `app/Repositories/UserRepository.php`
- `app/Repositories/TaskRepository.php`

Repository đóng vai trò trung gian giữa Service và database:
- truy vấn Eloquent
- tạo mới bản ghi
- cập nhật/xoá
- truy vấn theo user

Đây là nơi tập trung logic CRUD, giúp Service không phụ thuộc trực tiếp vào cấu trúc query của database.

### 3.5 Model layer
File:
- `app/Models/User.php`
- `app/Models/Task.php`

Model đại diện cho bảng dữ liệu và quan hệ Eloquent.
- `User` liên kết với các task và session auth
- `Task` lưu thông tin task với `user_id`, trạng thái, tiêu đề, mức ưu tiên, deadline, ...

## 4. Validation và response format

### 4.1 Request validation
File:
- `app/Http/Requests/*.php`

Mỗi request riêng cho từng endpoint:
- `RegisterRequest`, `LoginRequest`
- `StoreTaskRequest`, `UpdateTaskRequest`

Tác dụng:
- kiểm tra dữ liệu đầu vào
- chuẩn hóa lỗi validation
- giảm rủi ro dữ liệu sai từ client

### 4.2 Resource response
File:
- `app/Http/Resources/UserResource.php`
- `app/Http/Resources/TaskResource.php`

Resource dùng để format response trước khi trả cho client, giúp:
- ẩn các trường nhạy cảm
- chuẩn hóa dữ liệu
- giữ API contract rõ ràng

## 5. Xác thực và bảo mật

### 5.1 Sanctum + cookie auth
Dự án dùng Laravel Sanctum với cookie-based authentication.

Các điểm chính:
- Route public auth: `/api/auth/login`, `/api/auth/register`
- Route protected: `auth:sanctum` middleware
- Client gửi cookie kèm request, nên cần bật `withCredentials: true`
- CSRF cookie được lấy trước khi thực hiện login/register

### 5.2 Quyền truy cập dữ liệu
`TaskService` kiểm tra quyền sở hữu công việc trước khi update/delete/show.

Mỗi thao tác liên quan task đều validate `task->user_id === auth user id` để tránh users truy cập nhầm dữ liệu của người khác.

## 6. Swagger / API docs

File tài liệu API:
- `app/Docs/AuthDoc.php`
- `app/Docs/TaskDoc.php`

Swagger được cấu hình qua:
- `config/l5-swagger.php`

Tài liệu API có thể xem tại:
- `http://localhost:8000/api/documentation`


## 7. Nguyên tắc thiết kế

- Controller chỉ tập trung xử lý HTTP
- Business logic đặt trong Service
- Database logic đặt trong Repository
- Dữ liệu đầu vào được validate ở Request
- Response được định dạng rõ ràng qua Resource
- Mỗi user chỉ có quyền truy cập task của chính mình
- API được tài liệu hóa qua Swagger để dễ test và 유지 sau này


# Task Management System

Dự án quản lý công việc cho bài Pre-Test, được triển khai theo kiến trúc full-stack với React + Vite ở frontend và Laravel API ở backend. Môi trường dev được chuẩn hóa bằng Docker Compose, còn production được thiết lập quy trình tự động hóa **CI/CD** (GitHub Actions + Docker Hub) và triển khai trực tiếp trên **VPS Ubuntu** 

- **Frontend:** [https://blueskydev04.id.vn/](https://blueskydev04.id.vn/)
- **API Production:** [https://api.blueskydev04.id.vn/](https://api.blueskydev04.id.vn/)
- **Swagger Documentation:** [https://api.blueskydev04.id.vn/api/documentation](https://api.blueskydev04.id.vn/api/documentation)
<div align="center">
  <img src="https://github.com/user-attachments/assets/03828f34-200e-4032-97e1-71f71488d0ad" alt="Dashboard" width="600" />
  <p><em>Giao diện Dashboard tổng quan</em></p>
  <br />

  <img src="https://github.com/user-attachments/assets/163f6b06-c80b-4cb7-8499-2f5edd1e938c" alt="Trang quản lý task" width="600" />
  <p><em>Trang quản lý danh sách Task</em></p>
  <br />

  <img src="https://github.com/user-attachments/assets/942f09e3-6b31-4521-b67a-0a5e244c6ca4" alt="Chức năng kéo thả task" width="600" />
  <p><em>Chức năng kéo thả (Drag and Drop) trạng thái Task</em></p>
</div>



Hệ thống đã hoàn thiện các chức năng cơ bản của task management và xác thực người dùng.

## 1. Tổng quan dự án

Hệ thống đã triển khai các chức năng chính sau:
- Đăng ký, đăng nhập, đăng xuất
- Xác thực người dùng theo cookie bằng Sanctum
- Quản lý công việc theo user riêng biệt
- Tạo, xem, cập nhật, xoá task
- Tìm kiếm theo tiêu đề, lọc theo trạng thái và mức ưu tiên
- Dashboard hiển thị tổng quan task, công việc quá hạn, công việc sắp đến hạn
- Drag & drop task giữa các trạng thái bằng @dnd-kit
- Quản lý auth state bằng Zustand
- API document bằng L5-Swagger
  

## 2. Công nghệ sử dụng

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Axios
- Zustand cho quản lý state toàn cục
- @dnd-kit/core cho drag & drop task board
- TailwindCSS
### Backend
- Laravel 13
- PHP 8.3
- MySQL 8.4
- Sanctum cho xác thực
- Cookie-based authentication
- L5-Swagger cho API documentation

### DevOps
- Docker Compose
- GitHub Actions
- Docker Hub + SSH deployment cho môi trường prod

## 3. Kiến trúc hệ thống

### 3.1 Frontend theo hướng modules hoá

Frontend được tổ chức theo từng module chức năng, mỗi module chứa logic và view riêng biệt để dễ mở rộng và bảo trì. State người dùng và trạng thái auth được quản lý bằng Zustand, còn giao diện drag & drop task board dùng @dnd-kit để kéo thả giữa các cột trạng thái task.

```text
client/src/
├── api/
│   └── axiosClient.ts
├── modules/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── routes/
│   ├── tasks/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── routes/
│   └── users/
│       ├── api/
│       └── routes/
├── routes/
│   ├── AppRoutes.tsx
│   └── RouteGuards.tsx
├── stores/
│   └── useAuthStore.ts
├── types/
└── App.tsx
```

Mỗi module giữ các thành phần tương ứng:
- `api`: gọi API riêng của module
- `routes`: khai báo route của module
- `components`: UI fragment theo chức năng
- `hooks`: logic và state riêng theo module
- `pages`: màn hình chính

Điểm mạnh của mô hình này là:
- Tách biệt chức năng rõ ràng
- Dễ thêm module mới mà không ảnh hưởng module khác
- Mỗi feature có phạm vi triển khai độc lập
- Dễ scale khi dự án lớn hơn

### 3.2 Backend theo pattern Controller - Service - Repository

Backend Laravel được xây dựng theo mô hình phân lớp rõ ràng:

```text
server/app/
├── Http/
│   ├── Controllers/
│   │   ├── AuthController.php
│   │   └── TaskController.php
│   ├── Requests/
│   │   ├── StoreTaskRequest.php
│   │   └── UpdateTaskRequest.php
│   ├── Resources/
│   │   ├── TaskResource.php
│   │   └── UserResource.php
│   └── Resources/
├── Services/
│   ├── AuthService.php
│   └── TaskService.php
├── Repositories/
│   ├── UserRepository.php
│   └── TaskRepository.php
├── Models/
│   ├── User.php
│   └── Task.php
├── Docs/
│   ├── AuthDoc.php
│   └── TaskDoc.php
└── routes/
    └── api.php
```

Nguyên tắc triển khai:
- Controller: chỉ nhận request HTTP, gọi service, trả về response. Không chứa logic nghiệp vụ phức tạp.
- Service: chứa toàn bộ business logic, validation nghiệp vụ, giới hạn quyền truy cập, xử lý workflow.
- Repository: xử lý thao tác với database như query, create, update, delete.
- Model: đại diện dữ liệu và quan hệ Eloquent.
- Request: validate dữ liệu đầu vào theo từng endpoint
- Resource: định dạng response chuẩn hóa cho phía client chỉ expose các field cần thiết.

## 4. Docker Dev vs Docker Prod

### 4.1 Môi trường dev

File cấu hình:
- `docker-compose.yml`
- `server/Dockerfile`
- `client/Dockerfile`

- frontend chạy trên port 5173
- backend chạy trên port 8000
- MySQL chạy trên port 3307 cho local

Cấu trúc:
- `backend` container: `php artisan serve`
- `frontend` container: `npm run dev -- --host 0.0.0.0 --port 5173`
- `mysql` container: MySQL 8.4, chạy trong cùng Docker network với backend, port local expose ra `3307:3306`, data lưu ở volume `mysql_data`


### 4.2 Môi trường prod

File cấu hình:
- `docker-compose.prod.yml`
- `server/Dockerfile.prod`
- `client/Dockerfile.prod`

Mục tiêu:
- build image sản phẩm, chạy ổn định cho production
- frontend dùng Nginx để phục vụ static build

Trong production, frontend không chạy `npm run dev` mà build thành static.

## 5. API và Swagger

Swagger được tích hợp bằng gói `l5-swagger`.

Các file tài liệu API được định nghĩa trong:
- `server/app/Docs/AuthDoc.php`
- `server/app/Docs/TaskDoc.php`

Cấu hình Swagger nằm ở:
- `server/config/l5-swagger.php`

Swagger UI có thể truy cập tại:
```text
http://localhost:8000/api/documentation
https://api.blueskydev04.id.vn/api/documentation
```

Nếu cần generate lại tài liệu:
```bash
cd server
php artisan l5-swagger:generate
```

## 6. Luồng chức năng chính

### 6.1 Đăng ký / đăng nhập
1. Frontend gửi request đến `/api/auth/register` hoặc `/api/auth/login`
2. `AuthController` nhận request
3. `AuthService` xử lý nghiệp vụ và hash password / xác thực người dùng
4. `UserRepository` thao tác database
5. Response trả về user

### 6.2 Quản lý task
1. Frontend gọi `/api/tasks`
2. `TaskController` nhận request và truyền user id + payload cho `TaskService`
3. `TaskService` kiểm tra quyền sở hữu công việc và thực hiện business logic
4. `TaskRepository` thực hiện `get/create/update/delete`
5. `TaskResource` chuẩn hóa dữ liệu trả về client

### 6.3 Xác thực bằng Sanctum và cookie-based auth
Hệ thống sử dụng Sanctum để xác thực người dùng theo cookie

1. Frontend gọi `/sanctum/csrf-cookie` trước khi đăng nhập hoặc đăng ký
2. Axios được cấu hình với `withCredentials: true` và `withXSRFToken: true`
3. User gửi request đăng nhập/đăng ký đến API
4. Laravel xác thực thông tin người dùng và tạo session
5. Server set cookie cho browser
6. Browser tự động gắn cookie trong các request tiếp theo
7. Middleware `auth:sanctum` kiểm tra quyền truy cập


## 7. Hướng dẫn chạy dự án bằng Docker Dev

### Yêu cầu
- Docker
- Docker Compose
- Git
- MySQL 

### Bước 1: Clone repo
```bash
git clone <repo-url>
cd Task-Management-System
```

### Bước 2: Khởi tạo môi trường
Project đã có file `.env` ở root và `server/.env.example` để cấu hình nhanh.

Nếu cần tạo lại env backend:
```bash
cd server
cp .env.example .env
```

### Bước 3: Chạy container dev
```bash
docker compose up --build
```

### Bước 4: Kiểm tra service
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/api/documentation
- MySQL: localhost:3307

### Bước 5: Khởi tạo dữ liệu / migration
Chạy migration:
```bash
docker compose exec backend php artisan migrate
```

Seed dữ liệu mẫu:
```bash
docker compose exec backend php artisan db:seed
```

### Bước 6: Dừng container
```bash
docker compose down
```

## 8. Cấu hình VPS cho production

Dự án này đã được deploy trên VPS Ubuntu với cấu hình:
- OS: Ubuntu 22.04.1 LTS 
- RAM: 2 GB
- SSD: 20 GB NVMe U.2
- Docker + Docker Compose
- OpenSSH


## 9. Trỏ tên miền, DNS và reverse proxy

Dự án đã được deploy với hai endpoint chính:
- Frontend: `https://blueskydev04.id.vn/`
- API: `https://api.blueskydev04.id.vn/`

### 8.1 Trỏ domain và subdomain
- Tên miền gốc `blueskydev04.id.vn` trỏ tới IP của VPS
- Subdomain `api.blueskydev04.id.vn` cũng trỏ tới cùng IP VPS
- Sau khi DNS phân giải, người dùng truy cập qua domain và subdomain thay vì trực tiếp vào port container

### 8.2 Reverse proxy
VPS sử dụng Nginx làm reverse proxy để route request:
- request đến domain gốc được chuyển tới frontend
- request đến subdomain API được chuyển tới backend Laravel
- HTTP sẽ được redirect sang HTTPS


### 8.3 SSL
SSL được cấp và renew bằng Certbot + Let's Encrypt. Sau khi Certbot hoàn tất, Nginx sẽ proxy HTTPS tới đúng service tương ứng

## 10. Chạy project ở local (không dùng Docker)

### Backend
```bash
cd server
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 11. Mô tả luồng CI/CD

Dự án đã có workflow GitHub Actions tại:
- `.github/workflows/ci-cd.yml`

Luồng hoạt động thực tế như sau:

1. Trigger
   - Push code lên nhánh `main` 
 
2. Build stage
   - Checkout source
   - Setup PHP 8.3
   - Install backend dependencies bằng Composer
   - Validate Laravel config (`php artisan key:generate`, `config:clear`, `route:clear`)

3. Build image production
   - Build image frontend từ `client/Dockerfile.prod`
   - Build image backend từ `server/Dockerfile.prod`

4. Push image lên Docker Hub
   - Sau khi build xong, GitHub Actions login vào Docker Hub bằng secrets
   - Đẩy image frontend và backend lên registry với tag `latest` 

5. SSH vào VPS và pull image mới
   - GitHub Actions tự động truy cập VPS bằng `appleboy/ssh-action`
   - Vào thư mục deploy của dự án trên VPS
   - Chạy `docker compose pull` để tải image mới nhất từ Docker Hub
   - Chạy `docker compose up -d --remove-orphans` để cập nhật container đang chạy

6. Kết quả
   - Production tự động cập nhật khi có code mới được push lên branch main
   - Frontend và backend chạy từ image mới nhất trên Docker Hub
   - Domain và subdomain đều trỏ tới VPS, và Nginx reverse proxy routing request tới đúng container


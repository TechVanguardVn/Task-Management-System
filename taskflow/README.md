# Taskflow – Task Management System

Laravel 11 (API, Sanctum) + React (Vite) + MySQL, chạy bằng Docker Compose.

## Chạy nhanh (chỉ cần cài Docker Desktop, không cần PHP/Node/MySQL)

> **Trước khi chạy:** cài [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/Mac) hoặc Docker Engine (Linux), sau đó **mở Docker Desktop lên và đợi** đến khi thấy góc dưới bên trái hiện **"Engine running"** (chấm xanh). Lần đầu mở sau khi khởi động máy có thể mất 1-2 phút. Nếu chạy lệnh bên dưới ngay khi Docker chưa kịp khởi động xong, sẽ gặp lỗi kiểu:
> ```
> failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
> ```
> Gặp lỗi này thì chỉ cần đợi Docker Desktop chạy xong (hoặc mở lại nó) rồi chạy lệnh lại, không phải do code hay do máy tính cấu hình sai.

```bash
cd taskflow
docker compose up --build
```

Lần đầu chạy sẽ mất vài phút để tải image và cài thư viện — cần có Internet. Khi thấy log không còn báo lỗi và đứng yên (server đã chạy), mở:

| Địa chỉ | Mô tả |
|---|---|
| http://localhost:3000 | Ứng dụng React |
| http://localhost:3000/docs | Swagger UI (OpenAPI) |
| localhost:3307 | MySQL (DBeaver/TablePlus/MySQL Workbench) |

Tài khoản demo: `demo@taskflow.test` / `password123`

> Không cần tạo file `.env` — `docker-compose.yml` đã có sẵn giá trị mặc định, và `APP_KEY` được tự sinh khi container khởi động lần đầu.

## Cấu hình database
Sửa file `.env` ở thư mục này (DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_ROOT_PASSWORD).
Đổi xong chạy: `docker compose down -v && docker compose up --build`.

## Cấu trúc
```
taskflow/
├── backend-overlay/   code Taskflow (controller, model, migration, seeder, routes, openapi)
├── backend/           (tự sinh sau setup) project Laravel hoàn chỉnh
├── frontend/          React + Vite + Dockerfile + nginx.conf
├── docker-compose.yml
├── .env.example
└── setup.sh / setup.bat
```

> Thư viện PHP (vendor/) được cài bên trong Docker khi build, nên trên máy tính sẽ không có thư mục vendor/.

## Chạy không dùng Docker
- Backend: trong `backend/` chạy `composer install`, copy `.env.example` thành `.env` rồi `php artisan key:generate`, sửa `.env` (DB_HOST=127.0.0.1, DB_DATABASE, DB_USERNAME, DB_PASSWORD), rồi `php artisan migrate --seed && php artisan serve`
- Frontend: trong `frontend/` chạy `npm install && npm run dev` (http://localhost:5173, tự proxy /api sang :8000)

## API
Xem `backend-overlay/public/openapi.yaml` hoặc trang /docs.
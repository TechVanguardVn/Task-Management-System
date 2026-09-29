# Task Management System

## Công nghệ

- Java 26, Spring Boot 4.1.1, Maven
- Spring Web MVC, Spring Security, Spring Data JPA
- PostgreSQL 16, Flyway, BCrypt, JWT HS256
- React, Vite, TypeScript, Tailwind CSS
- Docker Compose và Nginx

## Chạy ứng dụng


```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Truy cập:

- Frontend: `http://localhost`
- Backend Swagger: `http://localhost:8080/swagger-ui.html`

Flyway tự chạy migration V1, V2 và V3 khi backend khởi động.

Xóa database và chạy lại migration:

```bash
docker compose down -v
docker compose up -d --build
```

Tài khoản demo:

```text
alice@example.com / Password@123
bob@example.com   / Password@123
```

## Chức năng đã làm

- Đăng ký, đăng nhập, BCrypt và JWT stateless
- Phân quyền theo user; mỗi user chỉ thấy task của mình
- Task CRUD, cập nhật trạng thái và validation
- Tìm kiếm theo tiêu đề, lọc status/priority, phân trang
- Dashboard thống kê task và task sắp đến hạn
- CORS và xử lý lỗi JSON thống nhất
- Swagger UI hỗ trợ Bearer token
- PostgreSQL migration bằng Flyway và JPA schema validation
- Docker build cho frontend/backend và GitHub Actions chạy test



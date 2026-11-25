# Task Management System

Ứng dụng quản lý công việc cá nhân và theo dõi tiến độ theo mô hình Kanban, xây dựng với kiến trúc phân tầng trên **Spring Boot 3 (Java 21)** và **React 18 (TypeScript)**, đóng gói hoàn chỉnh với **PostgreSQL**, **Redis** và **Docker Compose**.

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docs.docker.com/compose/)

> **Video Demo:** [https://youtu.be/ZRuPLY0eEKQ](https://youtu.be/ZRuPLY0eEKQ)

---

## Mục lục

- [1. Tổng quan & Tính năng](#1-tổng-quan--tính-năng)
- [2. Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
- [3. Cơ sở dữ liệu & Migration](#3-cơ-sở-dữ-liệu--migration)
- [4. Cài đặt & Khởi chạy](#4-cài-đặt--khởi-chạy)
- [5. Tài khoản Demo có sẵn](#5-tài-khoản-demo-có-sẵn)
- [6. Tài liệu API & Endpoints](#6-tài-liệu-api--endpoints)
- [7. Kiểm thử & CI Pipeline](#7-kiểm-thử--ci-pipeline)
- [8. Cấu trúc thư mục](#8-cấu-trúc-thư-mục)

---

## 1. Tổng quan & Tính năng

### Đã hoàn thành

**Nhóm tính năng cốt lõi:**
- **Xác thực & Bảo mật:** Đăng ký, đăng nhập, đăng xuất và xem thông tin cá nhân. Mật khẩu băm bằng BCrypt (strength 12), xác thực qua Stateless JWT, kết hợp Redis lưu Token Blacklist khi đăng xuất và Rate Limiting chống brute-force. Mọi thao tác đọc/ghi dữ liệu đều kiểm tra quyền sở hữu theo `userId` (chống IDOR).
- **Quản lý công việc (Task CRUD):** Tạo, xem chi tiết, chỉnh sửa, xóa và chuyển đổi trạng thái (`TODO`, `IN_PROGRESS`, `DONE`), mức độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`), hạn hoàn thành (`dueDate`).
- **Tìm kiếm, Lọc & Phân trang:** Tìm kiếm theo tiêu đề và mô tả (có debounce), lọc đa điều kiện theo trạng thái và độ ưu tiên, phân trang server-side qua `Pageable`. Trạng thái bộ lọc được đồng bộ lên URL query params để giữ nguyên khi reload trang.
- **Dashboard thống kê:** Tổng hợp tổng số công việc, số lượng theo từng trạng thái, tỷ lệ hoàn thành và danh sách các công việc sắp đến hạn / quá hạn. Dữ liệu thống kê được cache trên Redis (`@Cacheable`) và tự động xóa cache (`@CacheEvict`) khi có thay đổi.

**Nhóm tính năng mở rộng:**
- **Bảng Kanban kéo thả:** Giao diện 3 cột (`Chưa bắt đầu`, `Đang thực hiện`, `Đã hoàn thành`) hỗ trợ kéo thả HTML5 Native và cập nhật trạng thái thời gian thực.
- **Đầu việc con (Subtasks):** Thêm, xóa, tick hoàn thành từng đầu việc con ngay trong khung chi tiết; tự động tính lại phần trăm tiến độ của công việc cha.
- **Nhật ký hoạt động (Activity Logs):** Tự động lưu lịch sử khi tạo công việc, đổi trạng thái, thêm/xóa/tick subtask; hiển thị dạng timeline trong chi tiết task và ngăn kéo trượt toàn cục.
- **Xuất dữ liệu (Export):** Xuất toàn bộ công việc ra file JSON hoặc CSV (có tiền tố UTF-8 BOM để mở trực tiếp trên Excel không lỗi font tiếng Việt).
- **Giao diện & Trải nghiệm:** Hỗ trợ Dark / Light Mode, thiết kế responsive cho nhiều kích thước màn hình.
- **Hạ tầng & Tài liệu:** Swagger / OpenAPI 3 UI, Flyway Database Migration, DataSeeder dữ liệu mẫu, Docker Compose và GitHub Actions CI.

### Chưa hoàn thành / Hướng phát triển tiếp
- **Deploy Cloud:** Đã đóng gói hoàn chỉnh qua Docker Compose chạy local, chưa cấu hình deploy lên cloud server thực tế.

---

## 2. Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| **Backend** | Java 21, Spring Boot 3.3.5, Spring Security 6, Spring Data JPA (Hibernate 6), Bean Validation |
| **Frontend** | React 18, TypeScript 5 (Strict Mode), Vite 5, Tailwind CSS 3, Axios, Lucide React |
| **Database & Cache** | PostgreSQL 16 (Production), H2 In-Memory (Dev/Test), Flyway Migration, Redis 7 |
| **Testing & Docs** | JUnit 5, Mockito, AssertJ, SpringDoc OpenAPI 3 / Swagger UI |
| **DevOps & CI** | Docker, Docker Compose, Nginx 1.25 Alpine, GitHub Actions |

---

## 3. Cơ sở dữ liệu & Migration

- Cấu trúc bảng được quản lý bằng **Flyway** qua script ANSI SQL tại [`backend/src/main/resources/db/migration/V1__init_schema.sql`](backend/src/main/resources/db/migration/V1__init_schema.sql).
- Gồm 4 bảng chính kèm khóa ngoại (`ON DELETE CASCADE` / `SET NULL`), ràng buộc `CHECK` và các chỉ mục (index) tối ưu truy vấn:
  - `users`: Lưu thông tin tài khoản và phân quyền.
  - `tasks`: Lưu công việc, trạng thái, độ ưu tiên, hạn hoàn thành.
  - `subtasks`: Lưu danh sách đầu việc con gắn với `tasks`.
  - `task_activity_logs`: Lưu lịch sử thao tác của người dùng trên từng task.
- Khi khởi động lần đầu ở cả môi trường `dev` và `prod`, `DataSeeder` sẽ tự động kiểm tra và nạp sẵn dữ liệu mẫu nếu database còn trống.

---

## 4. Cài đặt & Khởi chạy

### Biến môi trường

File mẫu nằm tại [`.env.example`](.env.example) (không chứa secret thật). Khi chạy qua Docker Compose, các biến môi trường mặc định đã được khai báo sẵn trong `docker-compose.yml`. Nếu chạy tùy biến, sao chép file mẫu trước khi chạy:

```bash
cp .env.example .env
```

### Cách 1: Chạy bằng Docker Compose (Khuyến nghị)

Yêu cầu máy đã cài **Docker** và **Docker Compose**.

```bash
cd task-management-system
docker compose up -d --build
```

Sau khi 4 container (`postgres`, `redis`, `backend`, `frontend`) khởi động hoàn tất:
- **Ứng dụng Web:** [http://localhost:3000](http://localhost:3000) (hoặc [http://localhost](http://localhost))
- **Swagger UI:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

Lệnh dừng và dọn dẹp container:
```bash
# Dừng các container (giữ lại dữ liệu database)
docker compose down

# Dừng và xóa toàn bộ volume dữ liệu
docker compose down -v
```

### Cách 2: Chạy thủ công tại Local (Không cần cài PostgreSQL/Redis)

**1. Khởi chạy Backend (Profile `dev` mặc định dùng H2 In-Memory):**
- Yêu cầu: **JDK 21**, **Maven 3.8+**

```bash
cd task-management-system/backend
mvn spring-boot:run
```
- Backend chạy tại `http://localhost:8080`
- H2 Console tại `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:taskmanager_db`, User: `sa`, Password để trống)

**2. Khởi chạy Frontend:**
- Yêu cầu: **Node.js 18+**

```bash
cd task-management-system/frontend
npm install
npm run dev
```
- Frontend chạy tại `http://localhost:5173`

---

## 5. Tài khoản Demo có sẵn

Hệ thống nạp sẵn 2 tài khoản mẫu cùng 10 công việc mẫu để trải nghiệm ngay sau khi khởi động:

| Vai trò | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| **User** | `user@techvanguard.vn` | `User@123` | Có sẵn 10 task mẫu, subtasks, nhật ký hoạt động |
| **Admin** | `admin@techvanguard.vn` | `Admin@123` | Tài khoản quản trị viên mẫu |

---

## 6. Tài liệu API & Endpoints

Tài liệu chi tiết và giao diện test trực tiếp các request được cung cấp tại **Swagger UI**:  
[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

Các nhóm endpoint chính (prefix `/api/v1`):

| Nhóm | Method | Endpoint | Mô tả |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới |
| | `POST` | `/api/v1/auth/login` | Đăng nhập, trả về Access Token (JWT) |
| | `POST` | `/api/v1/auth/logout` | Đăng xuất & đưa token vào Redis Blacklist |
| | `GET` | `/api/v1/auth/me` | Lấy thông tin người dùng hiện tại |
| **Tasks** | `GET` | `/api/v1/tasks` | Lấy danh sách có tìm kiếm, lọc và phân trang |
| | `GET` | `/api/v1/tasks/kanban` | Lấy danh sách công việc cho bảng Kanban |
| | `GET` | `/api/v1/tasks/{id}` | Xem chi tiết task kèm subtasks & activity logs |
| | `POST` | `/api/v1/tasks` | Tạo mới công việc |
| | `PUT` | `/api/v1/tasks/{id}` | Cập nhật thông tin công việc |
| | `PATCH` | `/api/v1/tasks/{id}/status` | Đổi trạng thái công việc (dùng cho kéo thả Kanban) |
| | `DELETE` | `/api/v1/tasks/{id}` | Xóa công việc |
| **Subtasks** | `POST` | `/api/v1/tasks/{taskId}/subtasks` | Thêm đầu việc con |
| | `PUT` | `/api/v1/subtasks/{subtaskId}` | Cập nhật đầu việc con |
| | `PATCH` | `/api/v1/subtasks/{subtaskId}/toggle` | Đảo trạng thái hoàn thành của đầu việc con |
| | `DELETE` | `/api/v1/subtasks/{subtaskId}` | Xóa đầu việc con |
| **Dashboard** | `GET` | `/api/v1/dashboard/metrics` | Lấy số liệu thống kê (được cache trên Redis) |
| **Activities** | `GET` | `/api/v1/activities/recent` | Lấy nhật ký hoạt động gần đây của người dùng |
| | `GET` | `/api/v1/activities/tasks/{taskId}` | Lấy lịch sử thay đổi của một công việc |
| **Export** | `GET` | `/api/v1/export/tasks/csv` | Tải xuống danh sách công việc định dạng CSV (UTF-8 BOM) |
| | `GET` | `/api/v1/export/tasks/json` | Tải xuống danh sách công việc định dạng JSON |

---

## 7. Kiểm thử & CI Pipeline

Chạy toàn bộ Unit Test và Integration Test cho Backend (17 test cases bao phủ `AuthServiceTest`, `TaskServiceTest`, `DashboardServiceTest`, `TaskControllerTest`):

```bash
cd task-management-system/backend
mvn clean test
```

Kiểm tra typecheck và build production cho Frontend:

```bash
cd task-management-system/frontend
npm run build
```

Pipeline GitHub Actions (`.github/workflows/ci.yml`) tự động chạy `mvn clean test` và `npm run build` mỗi khi có commit push hoặc Pull Request trên các nhánh `main`, `dev`, `lehuuvan-interndev`.

---

## 8. Cấu trúc thư mục

```text
task-management-system/
├── .github/workflows/
│   └── ci.yml                  # CI workflow (Backend tests & Frontend build)
├── backend/
│   ├── src/main/java/com/techvanguard/taskmanager/
│   │   ├── config/             # Security, WebMvc, OpenAPI, Redis, DataSeeder
│   │   ├── controller/         # REST Controllers
│   │   ├── dto/                # Request & Response DTOs
│   │   ├── entity/             # JPA Entities
│   │   ├── enums/              # TaskStatus, TaskPriority, UserRole
│   │   ├── exception/          # GlobalExceptionHandler & Custom Exceptions
│   │   ├── mapper/             # Entity <-> DTO Mappers
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── security/           # JWT Provider, Filter, UserPrincipal
│   │   └── service/            # Service Interfaces & implement/
│   ├── src/main/resources/
│   │   ├── db/migration/
│   │   │   └── V1__init_schema.sql
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   └── application-prod.yml
│   ├── src/test/java/          # Unit & Integration Tests
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI & Layout
│   │   ├── context/            # AuthContext
│   │   ├── features/           # Modules theo tính năng (auth, tasks, dashboard, activity, export)
│   │   ├── services/api/       # Axios client & API services
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Tác giả

- **Lê Hữu Văn** — GitHub: [@vanlh25](https://github.com/vanlh25) | Email: `huuvan2005vn@gmail.com`

# Task Management System (Hệ thống Quản lý Công việc Doanh nghiệp)

> **Ứng viên**: Lê Hữu Văn (GitHub: [@vanlh25](https://github.com/vanlh25))  
> **Dự án**: TechVanguard Recruitment Technical Assessment  
> **Kiến trúc**: Enterprise Full-Stack (Spring Boot 3 + React 18 TypeScript + PostgreSQL + Redis + Docker)  

---

## 1. Giới thiệu tổng quan (Overview)

**Task Management System** là nền tảng quản lý công việc và quy trình tác nghiệp chuẩn doanh nghiệp, được thiết kế theo mô hình **Strict Layered Architecture** (Phân tầng nghiêm ngặt) ở Backend và **Feature-driven Architecture** ở Frontend.

Hệ thống cung cấp giải pháp toàn diện từ quản lý vòng đời công việc, bảng kéo thả Kanban trực quan, checklist đầu việc con (Subtasks), nhật ký hoạt động thời gian thực (Activity Audit Log), báo cáo số liệu năng suất (Productivity Dashboard có đệm Redis Cache), đến cơ chế trích xuất dữ liệu đa định dạng (CSV chuẩn UTF-8 BOM và JSON).

---

## 2. Công nghệ sử dụng (Tech Stack)

### Backend
- **Ngôn ngữ & Runtime**: Java 21 (LTS)
- **Framework**: Spring Boot 3.3.5
- **Bảo mật**: Spring Security 6, Stateless JWT (HMAC-SHA256, 256-bit secret), BCrypt Password Hashing (Strength 12)
- **Cơ sở dữ liệu & ORM**: Spring Data JPA, Hibernate 6, H2 Database (in-memory test/dev), PostgreSQL 16 (production)
- **Bộ nhớ đệm & Chống brute-force**: Redis 7 (Spring Data Redis), CacheManager, Token Blacklist, Rate Limiting (5 attempts/phút)
- **Tài liệu hóa API**: SpringDoc OpenAPI 3 / Swagger UI (v2.6.0)
- **Kiểm thử tự động**: JUnit 5, Mockito 5, AssertJ

### Frontend
- **Thư viện UI**: React 18
- **Ngôn ngữ**: TypeScript 5 (Strict Mode bật toàn diện, 0 lỗi `any`)
- **Build Tool**: Vite 5
- **Định dạng & Thiết kế**: Tailwind CSS 3, Lucide React Icons
- **Tương tác trực quan**: HTML5 Native Drag & Drop cho bảng Kanban
- **HTTP Client**: Axios với Interceptor tự động gắn Bearer JWT và xử lý hết hạn phiên (Auto Logout)

### Hạ tầng & DevOps
- **Containerization**: Docker & Docker Compose (Multi-stage build cho cả Java JRE 21 và Nginx)
- **Reverse Proxy**: Nginx Alpine (Reverse proxy định tuyến `/api/` về Backend và phục vụ SPA)

---

## 3. Bảng đối chiếu tính năng (Feature Matrix)

| Nhóm chức năng | Yêu cầu nghiệp vụ | Trạng thái | Điểm nhấn kỹ thuật |
|---|---|---|---|
| **Xác thực & Bảo mật (Auth)** | Đăng ký, Đăng nhập, Đăng xuất, Lấy Profile | ✅ **Hoàn thành** | Stateless JWT; Token Blacklist trên Redis; Rate Limiting chống Brute-force |
| **Quản lý công việc (Task CRUD)** | Thêm, sửa, xem chi tiết, xóa mềm, đổi trạng thái | ✅ **Hoàn thành** | Chống IDOR (luôn filter theo `userId`), Soft Delete / Status transition |
| **Tìm kiếm & Phân trang** | Tìm theo tiêu đề, lọc trạng thái/ưu tiên, phân trang | ✅ **Hoàn thành** | Spring Data JPA Specification/Method, phân trang `Pageable`, PageResponse chuẩn |
| **Bảng Kanban (Bonus)** | Kéo thả trực quan giữa các cột TODO, IN_PROGRESS, DONE | ✅ **Hoàn thành** | HTML5 Drag & Drop mượt mà, cập nhật real-time trạng thái về server |
| **Đầu việc con (Bonus)** | Checklist Subtasks bên trong Task chi tiết | ✅ **Hoàn thành** | Thêm, tick hoàn thành ngay trong Modal chi tiết; cập nhật tiến độ tức thì |
| **Nhật ký hoạt động (Bonus)** | Theo dõi lịch sử thay đổi (Audit Trail) | ✅ **Hoàn thành** | Tự động ghi log khi Tạo/Đổi trạng thái/Cập nhật; Drawer trực quan |
| **Dashboard năng suất (Bonus)**| Thống kê tổng số việc, tỷ lệ hoàn thành, việc quá hạn | ✅ **Hoàn thành** | Tích hợp Redis Cache (`@Cacheable`), tự động hủy cache (`@CacheEvict`) khi có thay đổi |
| **Xuất báo cáo (Bonus)** | Trích xuất công việc sang file CSV và JSON | ✅ **Hoàn thành** | CSV đính kèm **UTF-8 BOM (`\uFEFF`)** giúp Microsoft Excel hiển thị tiếng Việt hoàn hảo |
| **Giao diện & UX** | Giao diện Responsive (Mobile/Desktop), Dark Mode | ✅ **Hoàn thành** | Thiết kế Tailwind CSS sạch sẽ, hỗ trợ chuyển đổi Dark/Light mode tức thì |
| **Tài liệu & Triển khai** | Swagger API Docs, Docker Compose 1 lệnh chạy ngay | ✅ **Hoàn thành** | Nạp sẵn dữ liệu mẫu (`DataSeeder`) phục vụ chấm bài kiểm thử |

---

## 4. Tài khoản kiểm thử có sẵn (Zero-Setup Credentials)

Khi hệ thống khởi động lần đầu, `DataSeeder` sẽ tự động tạo sẵn 2 tài khoản và 10 công việc mẫu để người đánh giá có thể đăng nhập trải nghiệm ngay:

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích kiểm thử |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin@techvanguard.vn` | `Admin@123` | Toàn quyền kiểm tra hệ thống và các công việc mẫu quản trị |
| **Lập trình viên (User)** | `user@techvanguard.vn` | `User@123` | Trải nghiệm đầy đủ tính năng Kanban, Subtask, Dashboard, Xuất CSV/JSON |

---

## 5. Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### Cách 1: Khởi chạy 1 lệnh duy nhất với Docker Compose (Khuyến nghị)

Yêu cầu máy đã cài sẵn **Docker** và **Docker Compose**.

```bash
# 1. Di chuyển vào thư mục dự án
cd task-management-system

# 2. Khởi chạy toàn bộ hệ sinh thái (PostgreSQL, Redis, Backend, Frontend)
docker compose up --build -d
```

Sau khi các container báo trạng thái `healthy`, truy cập:
- **Giao diện ứng dụng (Frontend)**: [http://localhost](http://localhost) (Cổng 80)
- **API Swagger / OpenAPI**: [http://localhost/swagger-ui/index.html](http://localhost/swagger-ui/index.html) hoặc [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

Để dừng hệ thống:
```bash
docker compose down
```

---

### Cách 2: Khởi chạy thủ công ở môi trường phát triển (Local Development)

#### 1. Khởi chạy Backend (Spring Boot 3)
Yêu cầu: **JDK 21** và **Maven 3.8+** (hoặc dùng Maven Wrapper).  
Mặc định profile `dev` sử dụng H2 Database in-memory, không cần cài đặt PostgreSQL hay Redis:

```bash
cd task-management-system/backend

# Chạy kiểm thử tự động
mvn test

# Khởi động ứng dụng Backend
mvn spring-boot:run
```
Backend sẽ lắng nghe tại cổng `http://localhost:8080`.

#### 2. Khởi chạy Frontend (React + Vite)
Yêu cầu: **Node.js 18+** và **npm**:

```bash
cd task-management-system/frontend

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
Frontend sẽ hoạt động tại `http://localhost:5173`.

---

## 6. Kiểm thử tự động (Automated Testing)

Toàn bộ các luồng nghiệp vụ quan trọng đều được bảo vệ bởi bộ Unit Test chặt chẽ:
```bash
cd task-management-system/backend
mvn test
```

Kết quả kiểm thử:
- `AuthServiceTest`: Kiểm tra luồng Đăng ký tài khoản, Email trùng lặp (`DuplicateResourceException`), Đăng nhập thành công trả về JWT Token, Đăng nhập sai mật khẩu ném lỗi, Đăng xuất và lưu token vào Redis Blacklist.
- `TaskServiceTest`: Kiểm tra Tạo task, Cập nhật trạng thái Kanban, Kiểm tra quyền sở hữu chống IDOR (`ResourceNotFoundException`), Xóa mềm và Evict Redis Cache.
- `DashboardServiceTest`: Kiểm tra tính toán số liệu thống kê năng suất, tỷ lệ hoàn thành công việc và hoạt động của bộ đệm Redis.

---

## 7. Cấu trúc thư mục dự án (Project Directory Structure)

```text
task-management-system/
├── backend/
│   ├── src/main/java/com/techvanguard/taskmanager/
│   │   ├── config/             # Cấu hình Security, WebMvc, OpenAPI, Redis, DataSeeder
│   │   ├── controller/         # REST Controllers (Auth, Task, Subtask, ActivityLog, Dashboard, Export)
│   │   ├── dto/                # Request & Response Data Transfer Objects
│   │   ├── entity/             # JPA Entities (User, Task, Subtask, TaskActivityLog, BaseEntity)
│   │   ├── enums/              # Enums (TaskStatus, TaskPriority, UserRole)
│   │   ├── exception/          # GlobalExceptionHandler & Custom Business Exceptions
│   │   ├── mapper/             # Component Mappers (Entity <-> DTO)
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── security/           # CustomUserDetailsService, UserPrincipal, JwtTokenProvider, Filter
│   │   └── service/            # Interfaces và Thư mục implement/ chứa Business Logic
│   ├── src/main/resources/     # application.yml, application-dev.yml, application-prod.yml
│   ├── src/test/java/          # Unit Tests (AuthServiceTest, TaskServiceTest, DashboardServiceTest)
│   ├── Dockerfile              # Multi-stage build Eclipse Temurin 21 JRE
│   └── pom.xml                 # Maven dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI (Button, Input, Badge, Modal, Layout) và Task UI (Kanban, List, Modals)
│   │   ├── context/            # AuthContext (quản lý trạng thái đăng nhập toàn cục)
│   │   ├── pages/              # Các trang chính: LoginPage, RegisterPage, KanbanPage, TasksPage, DashboardPage, ExportPage
│   │   ├── services/api/       # Axios client và các API Service modules
│   │   ├── types/              # TypeScript Interfaces & Types
│   │   ├── App.tsx             # Định tuyến React Router & Route Protection
│   │   └── main.tsx            # Entrypoint
│   ├── Dockerfile              # Multi-stage build Node 20 & Nginx Alpine
│   ├── nginx.conf              # Cấu hình Nginx reverse proxy
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml          # Điều phối 4 dịch vụ: postgres, redis, backend, frontend
├── .env.example                # Biến môi trường mẫu
└── README.md                   # Tài liệu hướng dẫn bàn giao hệ thống
```

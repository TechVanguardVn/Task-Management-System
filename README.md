# Task Management System (Hệ thống Quản lý Công việc Doanh nghiệp)

> **Ứng viên**: Lê Hữu Văn (GitHub: [@vanlh25](https://github.com/vanlh25))  
> **Vị trí ứng tuyển**: Intern / Junior Fullstack Developer  
> **Dự án**: TechVanguard Recruitment Technical Assessment  
> **Repository gốc**: [TechVanguardVn/Task-Management-System](https://github.com/TechVanguardVn/Task-Management-System)  
> **Repository bài làm**: [vanlh25/Le-Huu-Van-Task-Management-System](https://github.com/vanlh25/Le-Huu-Van-Task-Management-System)  
> **Branch**: `lehuuvan-interndev`  
> **Video Demo hệ thống (3-5 phút)**: [https://youtu.be/ZRuPLY0eEKQ](https://youtu.be/ZRuPLY0eEKQ)

---

## 1. Video Demo

Xem video giới thiệu và trải nghiệm trực tiếp hệ thống tại:  
👉 **[https://youtu.be/ZRuPLY0eEKQ](https://youtu.be/ZRuPLY0eEKQ)**

---

## 2. Checklist bàn giao theo yêu cầu đề bài

Theo đúng quy chuẩn mục **5. Sản phẩm ứng viên phải bàn giao** trong đề bài tuyển dụng của TechVanguard:

| Hạng mục bàn giao | Trạng thái | Mô tả chi tiết |
|---|:---:|---|
| **Pull Request tạo vào repo gốc** | ✅ **Sẵn sàng** | Toàn bộ code nằm trên branch `lehuuvan-interndev` đã sẵn sàng mở PR vào `TechVanguardVn/Task-Management-System:main`. |
| **README hướng dẫn cài đặt & chạy** | ✅ **Hoàn thành** | Tài liệu chi tiết 2 cách khởi chạy: 1 lệnh với Docker Compose hoặc chạy thủ công tại local (H2 in-memory). |
| **File `.env.example`** | ✅ **Hoàn thành** | Đã tạo sẵn `.env.example` chuẩn mẫu, không chứa secret thật. |
| **Database Migration & Dữ liệu mẫu (Seed)** | ✅ **Hoàn thành** | Migration Flyway ANSI SQL (`V1__init_schema.sql`) kèm `DataSeeder` tự động khởi tạo 2 tài khoản và 10 công việc mẫu. |
| **API Documentation** | ✅ **Hoàn thành** | Tích hợp OpenAPI 3 / Swagger UI đầy đủ tài liệu schema, request/response và phân quyền Bearer Token. |
| **Danh sách chức năng Hoàn thành / Chưa hoàn thành** | ✅ **Hoàn thành** | Hoàn thành **100% chức năng bắt buộc (MVP)** và **100% chức năng cộng điểm (Bonus)** (chi tiết tại Mục 3). |
| **Video Demo 3–5 phút** | ✅ **Hoàn thành** | Video demo trực quan đầy đủ các luồng: [https://youtu.be/ZRuPLY0eEKQ](https://youtu.be/ZRuPLY0eEKQ). |

---

## 3. Bảng đối chiếu chức năng (Đã hoàn thành vs Chưa hoàn thành)

### A. Chức năng bắt buộc (MVP) - 100% Hoàn thành

| Chức năng | Trạng thái | Điểm nhấn kỹ thuật |
|---|:---:|---|
| **1. Quản lý tài khoản**<br>- Đăng ký, đăng nhập, đăng xuất<br>- Mật khẩu mã hóa an toàn<br>- Người dùng chỉ truy cập dữ liệu của mình | ✅ **Đã hoàn thành** | - Mật khẩu băm qua **BCrypt Strength 12**.<br>- **Stateless JWT (HMAC-SHA256)** với Access Token.<br>- **Token Blacklist trên Redis** khi người dùng đăng xuất.<br>- **Chống IDOR 100%**: Tất cả truy vấn đọc/ghi đều lọc theo `userId` từ `SecurityContext`. |
| **2. Quản lý công việc (Task CRUD)**<br>- Tạo, xem chi tiết, sửa, xóa công việc<br>- Đầy đủ tiêu đề, mô tả, trạng thái, mức ưu tiên, hạn chót<br>- Trạng thái: `TODO`, `IN_PROGRESS`, `DONE` | ✅ **Đã hoàn thành** | - Phân tầng rõ rệt Controller -> Service -> Repository.<br>- Trả dữ liệu chuẩn hóa `ApiResponse<T>`, DTO chuyên biệt không để lộ Entity JPA.<br>- Ràng buộc dữ liệu nghiêm ngặt ở cả Database (CHECK constraints) và Jakarta Bean Validation. |
| **3. Tìm kiếm và lọc**<br>- Tìm kiếm theo tiêu đề và mô tả<br>- Lọc theo trạng thái và mức ưu tiên<br>- Phân trang khi dữ liệu lớn | ✅ **Đã hoàn thành** | - Spring Data JPA truy vấn tối ưu kèm `Pageable`.<br>- **Đồng bộ trạng thái bộ lọc lên URL query params**, hỗ trợ reload / bookmark không mất bộ lọc.<br>- Debounce tìm kiếm mượt mà, không giật lag. |
| **4. Dashboard**<br>- Tổng số task<br>- Số task TODO, IN_PROGRESS, DONE<br>- Danh sách việc sắp đến hạn hoặc quá hạn | ✅ **Đã hoàn thành** | - Tích hợp **Redis Cache (`@Cacheable`)** tăng tốc độ tải số liệu thống kê thời gian thực.<br>- Tự động xóa cache (`@CacheEvict`) ngay khi thêm, sửa, xóa hoặc đổi trạng thái công việc. |

### B. Chức năng cộng điểm (Bonus) - 100% Hoàn thành

| Chức năng | Trạng thái | Điểm nhấn kỹ thuật |
|---|:---:|---|
| **Bảng Kanban kéo thả** | ✅ **Đã hoàn thành** | - Kéo thả trực quan HTML5 Native giữa 3 cột `Chưa bắt đầu`, `Đang thực hiện`, `Đã hoàn thành`.<br>- Cập nhật trạng thái tức thì về server và lưu xuống PostgreSQL. |
| **Checklist đầu việc con (Subtasks)** | ✅ **Đã hoàn thành** | - Thêm, xóa, tick hoàn thành từng Subtask bên trong Task.<br>- Tự động tính toán lại thanh phần trăm tiến độ (`progressPercentage`) tức thì. |
| **Nhật ký hoạt động (Audit Logs)** | ✅ **Đã hoàn thành** | - Tự động ghi nhận lịch sử (tạo task, cập nhật trạng thái, thêm/xóa/tick subtask).<br>- Xem nhanh qua Drawer trượt hoặc trong từng Task chi tiết. |
| **Xuất báo cáo CSV & JSON** | ✅ **Đã hoàn thành** | - Xuất danh sách công việc ra file JSON và CSV.<br>- CSV có tiền tố **UTF-8 BOM (`\uFEFF`)** giúp Microsoft Excel hiển thị tiếng Việt có dấu chuẩn 100%. |
| **Docker Compose** | ✅ **Đã hoàn thành** | - Đóng gói đầy đủ 4 container: `frontend` (Nginx), `backend` (Spring Boot), `postgres` (PostgreSQL 16), `redis` (Redis 7).<br>- Khởi chạy 1 lệnh duy nhất với healthcheck chuẩn. |
| **Database Migration (Flyway)** | ✅ **Đã hoàn thành** | - File migration `V1__init_schema.sql` khởi tạo bảng, khóa ngoại, chỉ mục index và CHECK constraints. |
| **Unit Test & Integration Test** | ✅ **Đã hoàn thành** | - 17 tests tự động (JUnit 5, Mockito, AssertJ) bao phủ Controller, Service, Cache và Security. |
| **Swagger / OpenAPI Documentation** | ✅ **Đã hoàn thành** | - SpringDoc OpenAPI 3 UI đầy đủ tài liệu API, schema và thử nghiệm request trực tiếp. |
| **CI Pipeline (GitHub Actions)** | ✅ **Đã hoàn thành** | - Workflow `.github/workflows/ci.yml` tự động build và chạy test cho cả Backend và Frontend khi push / tạo PR. |
| **Chế độ Sáng / Tối (Dark / Light Mode)** | ✅ **Đã hoàn thành** | - Giao diện thiết kế theo phong cách hiện đại với Tailwind CSS, chuyển đổi theme tức thì và ghi nhớ trên trình duyệt. |

### C. Chức năng chưa hoàn thành / Đề xuất nâng cấp trong tương lai
- **Thông báo đẩy thời gian thực qua WebSocket**: Hiện trạng thái được cập nhật qua REST API; có thể mở rộng thêm WebSocket/STOMP để nhiều người dùng trong nhóm nhìn thấy thay đổi tức thì.
- **Tải tệp đính kèm**: Hỗ trợ đính kèm file tài liệu (PDF, hình ảnh) vào từng công việc (upload lên AWS S3 / MinIO).

---

## 4. Công nghệ sử dụng (Tech Stack)

### Backend
- **Ngôn ngữ & Runtime**: Java 21 (LTS)
- **Framework**: Spring Boot 3.3.5
- **Bảo mật**: Spring Security 6, Stateless JWT (HMAC-SHA256), BCrypt Password Hashing (Strength 12)
- **Cơ sở dữ liệu & ORM**: Spring Data JPA, Hibernate 6, H2 Database (local test), PostgreSQL 16 (production)
- **Database Migration**: Flyway Migration (ANSI SQL)
- **Bộ nhớ đệm (Cache)**: Redis 7 (Spring Data Redis, CacheManager với JavaTimeModule)
- **Tài liệu hóa API**: SpringDoc OpenAPI 3 / Swagger UI (v2.6.0)
- **Kiểm thử tự động**: JUnit 5, Mockito, AssertJ

### Frontend
- **Thư viện UI**: React 18
- **Ngôn ngữ**: TypeScript 5 (Strict Mode bật toàn diện, không dùng `any`)
- **Build Tool**: Vite 5
- **Định dạng & Thiết kế**: Tailwind CSS 3, Lucide React Icons
- **Tương tác**: HTML5 Native Drag & Drop cho bảng Kanban
- **HTTP Client**: Axios với Interceptor tự động gắn Bearer Token và quản lý phiên đăng nhập

### Hạ tầng & DevOps
- **Containerization**: Docker & Docker Compose (Multi-stage build tối ưu kích thước image)
- **Web Server / Reverse Proxy**: Nginx 1.25 Alpine
- **CI Pipeline**: GitHub Actions (`.github/workflows/ci.yml`)

---

## 5. Tài khoản kiểm thử có sẵn (Seed Data)

Hệ thống được tích hợp sẵn `DataSeeder`. Khi khởi chạy lần đầu, ứng dụng tự động tạo sẵn 2 tài khoản và 10 công việc mẫu với đầy đủ trạng thái, mức độ ưu tiên, subtasks và nhật ký hoạt động:

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích kiểm thử |
|---|---|---|---|
| **Lập trình viên (User)** | `user@techvanguard.vn` | `User@123` | Trải nghiệm đầy đủ tính năng: Kanban, Subtask, Dashboard, Lọc/Tìm kiếm, Xuất CSV/JSON |
| **Quản trị viên (Admin)** | `admin@techvanguard.vn` | `Admin@123` | Kiểm tra tài khoản quyền quản trị viên |

---

## 6. Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### Cách 1: Khởi chạy 1 lệnh duy nhất với Docker Compose (Khuyến nghị)

Yêu cầu máy đã cài đặt **Docker Desktop** (hoặc Docker Engine & Docker Compose).

```bash
# 1. Di chuyển vào thư mục dự án
cd task-management-system

# 2. Khởi chạy toàn bộ hệ thống (PostgreSQL, Redis, Backend, Frontend)
docker compose up -d --build
```

Sau khi các container hoàn tất khởi động:
- **Giao diện ứng dụng (Frontend)**: [http://localhost:3000](http://localhost:3000) (hoặc [http://localhost](http://localhost))
- **Tài liệu API Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **Endpoint kiểm tra Backend**: [http://localhost:8080/api/v1/tasks](http://localhost:8080/api/v1/tasks)

Để dừng hệ thống:
```bash
docker compose down
```

Nếu muốn xóa toàn bộ dữ liệu database volume để khởi động lại từ đầu:
```bash
docker compose down -v
```

---

### Cách 2: Khởi chạy thủ công ở môi trường phát triển (Local Development)

#### 1. Khởi chạy Backend (Spring Boot 3)
Yêu cầu: **JDK 21** và **Maven 3.8+**.  
Mặc định profile `dev` sử dụng **H2 Database in-memory**, không cần cài đặt PostgreSQL hay Redis:

```bash
cd task-management-system/backend

# Chạy toàn bộ 17 Unit & Integration Tests
mvn clean test

# Khởi chạy ứng dụng Backend
mvn spring-boot:run
```
- Backend lắng nghe tại: `http://localhost:8080`
- Giao diện H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:taskmanager_db`, User: `sa`, Password để trống)

#### 2. Khởi chạy Frontend (React 18 + Vite)
Yêu cầu: **Node.js 18+** và **npm**:

```bash
cd task-management-system/frontend

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy server phát triển
npm run dev
```
- Frontend phát triển sẽ hoạt động tại: `http://localhost:5173`

---

## 7. Kiểm thử tự động (Automated Testing)

Chạy kiểm thử toàn bộ Backend:
```bash
cd task-management-system/backend
mvn clean test
```

Hệ thống gồm **17 tests tự động** bao phủ các luồng:
- `AuthServiceTest`: Đăng ký tài khoản mới, kiểm tra trùng lặp email (`DuplicateResourceException`), đăng nhập thành công trả về JWT, đăng nhập sai mật khẩu, đăng xuất và đưa token vào Redis Blacklist.
- `TaskServiceTest`: Tạo mới công việc, cập nhật trạng thái Kanban, xác thực quyền sở hữu chống lỗ hổng IDOR (`ResourceNotFoundException`), xóa công việc và hủy Redis Cache.
- `DashboardServiceTest`: Tính toán số liệu thống kê năng suất, tỷ lệ hoàn thành công việc và hoạt động của bộ đệm cache.
- `TaskControllerTest`: Kiểm thử tầng Controller với MockMvc, kiểm tra mã HTTP status và cấu trúc JSON trả về.

---

## 8. Cấu trúc thư mục dự án

```text
task-management-system/
├── .github/
│   └── workflows/
│       └── ci.yml              # Pipeline GitHub Actions CI (Test Backend & Build Frontend)
├── backend/
│   ├── src/main/java/com/techvanguard/taskmanager/
│   │   ├── config/             # Cấu hình Security, WebMvc, OpenAPI, Redis, DataSeeder
│   │   ├── controller/         # REST Controllers (Auth, Task, Subtask, ActivityLog, Dashboard, Export)
│   │   ├── dto/                # Request & Response Data Transfer Objects
│   │   ├── entity/             # JPA Entities (User, Task, Subtask, TaskActivityLog, BaseEntity)
│   │   ├── enums/              # Enums (TaskStatus, TaskPriority, UserRole)
│   │   ├── exception/          # GlobalExceptionHandler & Custom Business Exceptions
│   │   ├── mapper/             # Component Mappers chuyển đổi Entity <-> DTO
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── security/           # CustomUserDetailsService, UserPrincipal, JwtTokenProvider, Filter
│   │   └── service/            # Tầng Service phân tách Interface và implement/ chứa Business Logic
│   ├── src/main/resources/
│   │   ├── db/migration/
│   │   │   └── V1__init_schema.sql # Script Flyway Database Migration
│   │   ├── application.yml     # Cấu hình ứng dụng chung & Flyway
│   │   ├── application-dev.yml # Cấu hình H2 Database In-Memory cho môi trường dev
│   │   └── application-prod.yml# Cấu hình PostgreSQL & Redis cho môi trường Docker
│   ├── src/test/java/          # Unit & Integration Tests (17 tests)
│   ├── Dockerfile              # Multi-stage build Eclipse Temurin 21 JRE
│   └── pom.xml                 # Maven dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI (Badge, Button, Input, Modal, Layout)
│   │   ├── context/            # AuthContext (quản lý phiên đăng nhập và token toàn cục)
│   │   ├── features/           # Cấu trúc module theo tính năng: auth, tasks, dashboard, activity, export
│   │   ├── services/api/       # Axios client và các API Service modules
│   │   ├── types/              # TypeScript strict interfaces & types
│   │   ├── App.tsx             # Định tuyến React Router & Route Protection
│   │   └── main.tsx            # Entry point
│   ├── Dockerfile              # Multi-stage build Node 20 & Nginx Alpine
│   ├── nginx.conf              # Cấu hình Nginx reverse proxy định tuyến API và no-cache index.html
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml          # Điều phối 4 container: postgres, redis, backend, frontend
├── .env.example                # Biến môi trường mẫu
└── README.md                   # Tài liệu hướng dẫn bàn giao hệ thống chuẩn doanh nghiệp
```

---

## 9. Liên hệ bàn giao

- **Họ và tên**: Lê Hữu Văn
- **GitHub**: [@vanlh25](https://github.com/vanlh25)
- **Email**: hữu văn 2005 vn @ gmail.com
- **Branch nộp bài**: `lehuuvan-interndev`

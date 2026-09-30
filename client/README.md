# Kiến trúc Frontend (Client)

## 1. Tổng quan

Frontend của dự án được xây dựng bằng React + TypeScript + Vite, theo hướng module hoá để dễ mở rộng và bảo trì. Mỗi chức năng chính (auth, task, user) có một không gian riêng, với routing, API, component, hook và type riêng.

Mục tiêu của kiến trúc:
- Tách biệt từng feature theo module rõ ràng
- Không để toàn bộ logic UI và API nằm trong một file lớn
- Quản lý xác thực toàn cục qua Zustand
- Dùng route guard để phân quyền giữa route công khai và route cần login
- Tập trung API client ở một điểm để quản lý cookie, CSRF và error

## 2. Cấu trúc thư mục

```text
client/
├── src/
│   ├── api/
│   │   └── axiosClient.ts
│   ├── components/
│   │   └── layout/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── routes.tsx
│   │   │   └── types/
│   │   ├── tasks/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── routes.tsx
│   │   │   └── types/
│   │   └── users/
│   │       ├── pages/
│   │       └── routes.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── RouteGuards.tsx
│   ├── stores/
│   │   └── useAuthStore.ts
│   ├── types/
│   │   └── routesType.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── README.md
```

## 3. Thành phần chính

### 3.1 App bootstrap
File khởi tạo ứng dụng:
- `src/App.tsx`
- `src/main.tsx`

`App.tsx` làm 3 việc chính:
1. Gọi `checkAuth()` khi ứng dụng mới mount
2. Kiểm tra trạng thái `isAuthenticated` và `isLoading`
3. Render `BrowserRouter` và `AppLayout` nếu người dùng đã đăng nhập

Điều này đảm bảo ứng dụng không render giao diện nhầm trước khi session được xác thực.

### 3.2 HTTP client và auth
File:
- `src/api/axiosClient.ts`

`axiosClient` là instance axios dùng chung cho tất cả request:
- `baseURL` lấy từ biến môi trường `VITE_API_URL` hoặc mặc định `http://localhost:8000`
- `withCredentials: true` để gửi/nhận cookie giữa frontend và backend
- `withXSRFToken: true` để tự động gắn XSRF token
- interceptor `response` trả về `response.data` và xử lý lỗi 401 ở một nơi tập trung

Nhờ vậy, toàn bộ module không cần phải viết lại logic chung cho request/response.

### 3.3 State quản lý xác thực
File:
- `src/stores/useAuthStore.ts`

Dự án dùng Zustand để quản lý auth state toàn cục, bao gồm:
- `user`
- `isAuthenticated`
- `isLoading`
- `checkAuth()`
- `login()`
- `register()`
- `logout()`

Quy trình đăng nhập/đăng ký theo cookie-based Sanctum:
1. Gọi `getCsrfCookie()`
2. Gửi request login/register
3. Gọi `getProfile()` để lấy thông tin user mới
4. Cập nhật trạng thái vào store

### 3.4 Routing và route guards
File:
- `src/routes/AppRoutes.tsx`
- `src/routes/RouteGuards.tsx`

Cách tổ chức route:
- `authRoutes`: login, register, public pages
- `taskRoutes`: các page cần đăng nhập
- `userRoutes`: route liên quan người dùng

`AppRoutes` chia route thành 2 nhóm:
- `guestRoutes`: chỉ hiển thị khi chưa login
- `protectedRoutes`: chỉ hiển thị khi đã login

Điều này giúp tách logic phân quyền khỏi từng page cụ thể.

### 3.5 Module-based feature architecture
Mỗi module chứa các phần tương ứng theo chức năng:

```text
modules/auth/
├── api/
├── components/
├── hooks/
├── pages/
├── routes.tsx
└── types/
```

Ví dụ:
- `auth`: đăng nhập, đăng ký, lấy profile, logout
- `tasks`: CRUD task, filter, dashboard, drag/drop
- `users`: route và màn hình liên quan user

Mỗi module có thể có:
- `api`: gọi API riêng và định nghĩa payload type
- `hooks`: logic side-effect và state cục bộ
- `components`: UI nhỏ, tái sử dụng
- `pages`: màn hình chính
- `routes.tsx`: khai báo route của module
- `types`: interface cho dữ liệu feature

## 4. Nguyên tắc thiết kế

- Tách feature theo module: dễ maintain, dễ mở rộng
- Tập trung request/response logic: tránh lặp code
- State toàn cục ưu tiên cho auth: không lẫn state feature trong nhiều component
- Route-based permission: phân quyền ở cấp router thay vì nhúng logic trên từng component
- Tận dụng React + TypeScript để giảm lỗi runtime và tăng độ rõ ràng của API contracts
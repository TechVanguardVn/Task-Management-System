# Taskflow: Ứng dụng quản lý công việc cá nhân

## Tóm tắt
Ứng dụng fullstack quản lý công việc: **Express 5 + TypeScript + Prisma + PostgreSQL** (backend) và **React 19 + Vite** (frontend), có Kanban kéo thả, Dashboard, Swagger, Docker Compose, integration test và CI.

**Chạy nhanh:** `docker compose up --build`, mở http://localhost:8080 (Swagger: http://localhost:4000/api/docs)
**Tài khoản demo:** `demo@taskflow.dev` / `Demo@1234`
Hướng dẫn chi tiết (kể cả chạy không cần Docker): xem `README.md`.

## Chức năng đã hoàn thành
**Bắt buộc**
- [x] Đăng ký / đăng nhập / đăng xuất. Mật khẩu hash bcrypt; logout thu hồi phiên phía server.
- [x] Người dùng chỉ truy cập được dữ liệu của mình (task của người khác trả 404).
- [x] CRUD task: tiêu đề, mô tả, trạng thái `TODO/IN_PROGRESS/DONE`, ưu tiên, hạn hoàn thành (+ tags).
- [x] Tìm kiếm theo tiêu đề, lọc theo trạng thái và ưu tiên, sắp xếp, phân trang phía server.
- [x] Dashboard: tổng số task, chưa bắt đầu / đang làm / hoàn thành, tỉ lệ hoàn thành, quá hạn, danh sách sắp đến hạn.

**Cộng điểm**
- [x] Kanban kéo thả giữa các cột và sắp xếp trong cột (lưu thứ tự vào DB).
- [x] Docker Compose (Postgres + API + nginx), tự migrate và seed.
- [x] 32 integration test (Vitest + Supertest, chạy trên PostgreSQL thật).
- [x] Swagger / OpenAPI 3.
- [x] CI GitHub Actions: typecheck, test, build.
- [ ] Deploy demo lên cloud (chưa làm).

## Database
- Migration SQL: `backend/prisma/migrations/20261123000000_init/migration.sql`
- 3 bảng `users`, `sessions`, `tasks`. Khoá ngoại `ON DELETE CASCADE`, enum cho status/priority, CHECK constraint (tiêu đề không rỗng, email lowercase, `completed_at` khớp `status`, `position >= 0`, tối đa 10 tag…), index phục vụ lọc và dashboard.
- Seed: `backend/prisma/seed.ts` (2 user, 26 task).

## Điểm kỹ thuật đáng chú ý
- Phân quyền nằm ngay trong câu truy vấn (`where: { id, userId }`), không thể quên kiểm tra.
- `password_hash` bị `omit` toàn cục trong Prisma; chống dò email bằng thông báo lỗi giống nhau và so sánh hash giả.
- API Kanban `move` hỗ trợ `afterId` để kéo thả chính xác cả khi board đang lọc.
- Ràng buộc dữ liệu được kiểm chứng ở cả tầng API (Zod) lẫn tầng DB (CHECK constraint, có test riêng).

## Chưa hoàn thành / hướng phát triển
- Deploy cloud; chế độ nhóm (project + thành viên); refresh token / cookie httpOnly; test frontend; nhắc hạn qua email.

## Video demo
_(link video)_

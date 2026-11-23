## 1. Thông tin ứng viên
- Họ và tên – Trần Tuấn Thành
- GitHub – https://github.com/tuanthanhne935-dev
- Vị trí ứng tuyển – Fullstack Developer Intern
- Repository (fork) – https://github.com/tuanthanhne935-dev/Task-Management-System (nhánh `dev`)

## 2. Demo & tài liệu
- Video demo – _(đang cập nhật)_
- README (hướng dẫn đầy đủ) – https://github.com/tuanthanhne935-dev/Task-Management-System/blob/dev/README.md
- Chạy toàn bộ bằng 1 lệnh – `docker compose up --build`, rồi mở
  - Ứng dụng – http://localhost:8080
  - Swagger UI – http://localhost:4000/api/docs
  - Health check – http://localhost:4000/api/health

| Email | Mật khẩu | Ghi chú |
|---|---|---|
| `demo@taskflow.dev` | `Demo@1234` | 24 task mẫu, đủ trạng thái / ưu tiên / hạn |
| `alice@taskflow.dev` | `Alice@1234` | Dùng để thử phân quyền dữ liệu giữa 2 tài khoản |

## 3. Tổng quan
Em xây dựng Taskflow, ứng dụng quản lý công việc cá nhân theo đề bài, gồm REST API và giao diện web theo mẫu thiết kế trong đề (Kanban board).

Ngoài các chức năng bắt buộc, em tập trung vào tính đúng đắn của dữ liệu (ràng buộc ở cả tầng API và tầng database), bảo mật, kiểm thử tự động và khả năng chạy lại dễ dàng (Docker Compose, CI, PostgreSQL nhúng cho máy không có Docker).

## 4. Công nghệ sử dụng
| Thành phần | Công nghệ |
|---|---|
| Frontend | React 19, Vite, TypeScript, TanStack Query, React Router, dnd-kit |
| Backend | Node.js 24, Express 5, TypeScript, Zod |
| Database | PostgreSQL |
| ORM / Migration | Prisma 6 (migration SQL viết tay thêm CHECK constraint) |
| Xác thực | JWT + bảng `sessions` (thu hồi được), bcrypt |
| Tài liệu API | Swagger / OpenAPI 3 |
| Kiểm thử | Vitest + Supertest, integration test trên PostgreSQL thật |
| DevOps | Docker Compose, GitHub Actions |

## 5. Chức năng đã hoàn thành
### A. Bắt buộc (MVP)
- [x] Tài khoản – đăng ký, đăng nhập, đăng xuất; mật khẩu băm bằng bcrypt (cost 12).
- [x] Phân quyền dữ liệu – mọi truy vấn đều lọc theo người dùng hiện tại; truy cập task của người khác trả `404`.
- [x] Task CRUD – tiêu đề, mô tả, trạng thái `TODO` / `IN_PROGRESS` / `DONE`, mức ưu tiên, hạn hoàn thành, tags.
- [x] Tìm kiếm & lọc – tìm theo tiêu đề (không phân biệt hoa thường, hỗ trợ tiếng Việt có dấu), lọc kết hợp nhiều trạng thái / mức ưu tiên.
- [x] Sắp xếp & phân trang phía server.
- [x] Dashboard – tổng số task, số task theo trạng thái, tỉ lệ hoàn thành, số task quá hạn, danh sách sắp đến hạn (chọn 3/7/14/30 ngày), phân bố theo ưu tiên.

### B. Cộng điểm
- [x] Kanban board – kéo thả giữa các cột và sắp xếp trong cột, lưu thứ tự vào database, cập nhật ngay trên giao diện và hoàn tác nếu API lỗi; kéo thả đúng cả khi đang lọc.
- [x] Docker Compose – PostgreSQL + API + frontend (nginx), tự chạy migration và seed khi khởi động.
- [x] Integration test – 32 test.
- [x] Swagger / OpenAPI.
- [x] CI pipeline (GitHub Actions) – typecheck, test, build cho backend và frontend mỗi lần push / PR.
- [x] Giao diện responsive – desktop, tablet, mobile.
- [ ] Deploy demo lên cloud – chưa thực hiện.

### C. Bảo mật & chất lượng dữ liệu
- Đăng xuất thu hồi phiên phía server – token cũ bị vô hiệu ngay dù chưa hết hạn.
- Chống dò tài khoản – sai email và sai mật khẩu trả cùng thông báo, thời gian phản hồi tương đương.
- Không rò rỉ `password_hash` – ẩn mặc định ở tầng ORM.
- Rate limit cho đăng nhập / đăng ký, helmet, giới hạn kích thước body, chặn ghi đè trường không cho phép.
- Ràng buộc ở tầng database – khoá ngoại `ON DELETE CASCADE`, enum, CHECK constraint (tiêu đề không rỗng, email chữ thường, `completed_at` khớp `status`, `position >= 0`, tối đa 10 tag…), index cho lọc và dashboard.

## 6. Kiểm thử & tài liệu API
32 integration test chạy trên PostgreSQL thật, gồm
- Đăng ký / đăng nhập / đăng xuất, thu hồi phiên, validate dữ liệu.
- Phân quyền giữa 2 tài khoản (xem / sửa / xoá / kéo thả task của người khác đều bị chặn).
- Task CRUD, tìm kiếm tiếng Việt, lọc, phân trang (không trùng / sót bản ghi), sắp xếp.
- Kanban – di chuyển và đánh lại thứ tự.
- Dashboard – thống kê, quá hạn, sắp đến hạn.
- Ràng buộc database – CHECK constraint và cascade chặn dữ liệu sai kể cả khi bỏ qua tầng API.

```bash
cd backend
npm test        # cần TEST_DATABASE_URL trỏ tới database test riêng
```

## 7. Hướng dẫn chạy
Chi tiết trong README, gồm 3 cách – Docker Compose, PostgreSQL có sẵn, hoặc không cần cài PostgreSQL (script `npm run db:local` chạy PostgreSQL nhúng).

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run db:migrate && npm run db:seed
npm run dev            # http://localhost:4000

# Frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## 8. Giới hạn hiện tại & phần chưa làm
- Chưa deploy lên cloud; hiện chạy local hoặc bằng Docker Compose.
- Ứng dụng dành cho cá nhân, chưa có chế độ nhóm (project, thành viên, giao việc).
- Token lưu ở `localStorage`; hướng cải thiện là refresh token và cookie `httpOnly`.
- Kanban tải tối đa 1.000 task mỗi lần; Dashboard hiển thị tối đa 10 task sắp đến hạn và 10 task quá hạn.
- Chưa có test cho frontend.

## 9. Checklist bàn giao
- [x] Source code frontend và backend
- [x] README hướng dẫn cài đặt và chạy
- [x] `.env.example` (không chứa secret thật)
- [x] Database migration và dữ liệu mẫu (seed)
- [x] Tài liệu API (Swagger / OpenAPI)
- [x] Danh sách chức năng đã hoàn thành và chưa hoàn thành
- [ ] Video demo _(đang cập nhật)_

---

Em gửi Pull Request này để nộp bài cho vị trí Fullstack Developer Intern tại TechVanguard.

Em đã hoàn thành đầy đủ các chức năng bắt buộc cùng phần lớn chức năng cộng điểm. Thông tin chi tiết về cài đặt, thiết kế database, API và kiểm thử đều có trong README để anh/chị tiện review.

Em cảm ơn anh/chị đã dành thời gian xem xét bài làm của em.

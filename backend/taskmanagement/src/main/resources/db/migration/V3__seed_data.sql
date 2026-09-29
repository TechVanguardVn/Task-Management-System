
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (email, password_hash, full_name) VALUES
    ('alice@example.com', crypt('Password@123', gen_salt('bf', 10)), 'Alice Nguyen'),
    ('bob@example.com',   crypt('Password@123', gen_salt('bf', 10)), 'Bob Tran');

INSERT INTO tasks (user_id, title, description, status, priority, due_date)
SELECT u.id, t.title, t.description, t.status, t.priority, t.due_date
FROM users u
CROSS JOIN (VALUES
    ('Thiết kế database',        'Vẽ ERD và viết Flyway migration',              'DONE',        'HIGH',   CURRENT_DATE - 3),
    ('Xây dựng API đăng nhập',   'Đăng ký, đăng nhập, mã hóa mật khẩu BCrypt',   'DONE',        'HIGH',   CURRENT_DATE - 2),
    ('Task CRUD',                'Tạo, xem, sửa, xóa công việc',                 'IN_PROGRESS', 'HIGH',   CURRENT_DATE + 1),
    ('Tìm kiếm và phân trang',   'Tìm theo tiêu đề, lọc trạng thái và ưu tiên',  'IN_PROGRESS', 'MEDIUM', CURRENT_DATE + 2),
    ('Làm dashboard',            'Thống kê số task theo trạng thái',             'TODO',        'MEDIUM', CURRENT_DATE + 3),
    ('Viết README',              'Hướng dẫn cài đặt và chạy dự án',              'TODO',        'MEDIUM', CURRENT_DATE + 4),
    ('Thêm Docker Compose',      'Chạy app và PostgreSQL bằng 1 lệnh',           'TODO',        'LOW',    CURRENT_DATE + 5),
    ('Quay video demo',          'Video 3-5 phút giới thiệu chức năng',          'TODO',        'LOW',    NULL),
    ('Nộp bài quá hạn (mẫu)',    'Task quá hạn để test hiển thị',                'TODO',        'HIGH',   CURRENT_DATE - 1)
) AS t(title, description, status, priority, due_date)
WHERE u.email = 'alice@example.com';


INSERT INTO tasks (user_id, title, description, status, priority, due_date)
SELECT u.id, t.title, t.description, t.status, t.priority, t.due_date
FROM users u
CROSS JOIN (VALUES
    ('Học Spring Security',      'Đọc tài liệu về filter chain',                 'IN_PROGRESS', 'MEDIUM', CURRENT_DATE + 2),
    ('Viết unit test',           'Test cho service layer',                       'TODO',        'HIGH',   CURRENT_DATE + 4),
    ('Dọn dẹp code',             'Refactor và xóa code thừa',                    'TODO',        'LOW',    NULL),
    ('Cấu hình Swagger',         'Thêm springdoc-openapi',                       'DONE',        'LOW',    CURRENT_DATE - 2)
) AS t(title, description, status, priority, due_date)
WHERE u.email = 'bob@example.com';

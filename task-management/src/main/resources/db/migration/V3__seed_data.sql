-- V3: Dữ liệu mẫu (seed)
--
-- Tài khoản demo (mật khẩu của cả 2 tài khoản đều là: Password@123)
--   alice@example.com
--   bob@example.com
-- Mật khẩu đã được mã hóa bằng BCrypt (strength 10), tương thích BCryptPasswordEncoder.
--
-- Hạn hoàn thành tính theo CURRENT_DATE để Dashboard luôn có task "sắp đến hạn".
-- Cú pháp "CURRENT_DATE + INTERVAL 'n' DAY" là SQL chuẩn, chạy được trên MySQL, H2 và PostgreSQL.

INSERT INTO users (email, password, full_name) VALUES
    ('alice@example.com', '$2a$10$KHZNyIMtdIcW5TcHQNE7COwJb5OKxGHwYAh4v3VIUgHEfSK/laEjG', 'Alice Nguyen'),
    ('bob@example.com',   '$2a$10$KHZNyIMtdIcW5TcHQNE7COwJb5OKxGHwYAh4v3VIUgHEfSK/laEjG', 'Bob Tran');

-- Task của Alice: đủ 3 trạng thái, 3 mức ưu tiên, có task quá hạn / sắp đến hạn / không có hạn
INSERT INTO tasks (title, description, status, priority, due_date, created_at, updated_at, user_id) VALUES
    ('Thiết kế database',          'Vẽ ERD và viết migration cho users, tasks',     'DONE',        'HIGH',   CURRENT_DATE - INTERVAL '5' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Xây dựng API đăng nhập',     'JWT authentication với Spring Security',        'DONE',        'HIGH',   CURRENT_DATE - INTERVAL '2' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Viết API CRUD task',         'Tạo, xem, sửa, xóa task theo user đăng nhập',   'IN_PROGRESS', 'HIGH',   CURRENT_DATE + INTERVAL '1' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Tìm kiếm và lọc task',       'Tìm theo tiêu đề, lọc theo trạng thái/ưu tiên', 'IN_PROGRESS', 'MEDIUM', CURRENT_DATE + INTERVAL '3' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('API Dashboard',              'Thống kê số task theo trạng thái',              'TODO',        'MEDIUM', CURRENT_DATE + INTERVAL '5' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Viết unit test',             'Test cho TaskService và AuthService',           'TODO',        'MEDIUM', CURRENT_DATE + INTERVAL '7' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Cấu hình Docker Compose',    NULL,                                            'TODO',        'LOW',    CURRENT_DATE + INTERVAL '10' DAY, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Viết README hướng dẫn chạy', 'Cài đặt, chạy, tài khoản demo, link Swagger',   'TODO',        'LOW',    CURRENT_DATE + INTERVAL '12' DAY, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Sửa bug hiển thị ngày',      'Task đã quá hạn nhưng chưa xong',               'TODO',        'HIGH',   CURRENT_DATE - INTERVAL '1' DAY,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com')),
    ('Nghiên cứu CI pipeline',     'GitHub Actions chạy test khi push',             'TODO',        'LOW',    NULL,                             CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'alice@example.com'));

-- Task của Bob: dùng để kiểm tra Alice KHÔNG nhìn thấy dữ liệu của Bob
INSERT INTO tasks (title, description, status, priority, due_date, created_at, updated_at, user_id) VALUES
    ('Chuẩn bị slide demo', 'Slide 5 trang cho buổi demo', 'IN_PROGRESS', 'HIGH',   CURRENT_DATE + INTERVAL '2' DAY, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'bob@example.com')),
    ('Quay video demo',     'Video 3-5 phút',              'TODO',        'MEDIUM', CURRENT_DATE + INTERVAL '4' DAY, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'bob@example.com')),
    ('Review code',         NULL,                          'DONE',        'LOW',    CURRENT_DATE - INTERVAL '3' DAY, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (SELECT id FROM users WHERE email = 'bob@example.com'));

<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Nguyễn Văn An', 'email' => 'test@example.com'],
            ['name' => 'Trần Thị Lan', 'email' => 'lan.tran@example.com'],
            ['name' => 'Lê Hoàng Nam', 'email' => 'nam.le@example.com'],
            ['name' => 'Phạm Thị Hương', 'email' => 'huong.pham@example.com'],
            ['name' => 'Võ Minh Khôi', 'email' => 'khoi.vo@example.com'],
        ];

        foreach ($users as $userData) {
            $user = User::factory()->create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make('12345678'),
            ]);

            $taskTemplates = [
                ['title' => 'Thiết kế giao diện đăng nhập', 'description' => 'Thiết kế layout và xác nhận trải nghiệm người dùng trên màn hình đăng nhập.', 'status' => 'TODO', 'priority' => 'HIGH', 'due_date' => now()->addDays(1)->format('Y-m-d')],
                ['title' => 'Fix lỗi API danh sách task', 'description' => 'Xử lý lỗi pagination và lọc dữ liệu khi API trả về nhiều bản ghi.', 'status' => 'IN_PROGRESS', 'priority' => 'HIGH', 'due_date' => now()->addDays(2)->format('Y-m-d')],
                ['title' => 'Cập nhật giao diện dashboard', 'description' => 'Tối ưu widget thống kê, thẻ task và trạng thái công việc.', 'status' => 'DONE', 'priority' => 'MEDIUM', 'due_date' => now()->subDays(1)->format('Y-m-d')],
                ['title' => 'Viết unit test cho auth', 'description' => 'Bổ sung test cho đăng ký, đăng nhập và xác thực token.', 'status' => 'TODO', 'priority' => 'MEDIUM', 'due_date' => now()->addDays(4)->format('Y-m-d')],
                ['title' => 'Review code chức năng upload file', 'description' => 'Kiểm tra lại xử lý file lớn và cảnh báo khi upload thất bại.', 'status' => 'IN_PROGRESS', 'priority' => 'HIGH', 'due_date' => now()->addDays(3)->format('Y-m-d')],
                ['title' => 'Chuẩn bị tài liệu hướng dẫn', 'description' => 'Soạn nội dung hướng dẫn sử dụng hệ thống cho người dùng mới.', 'status' => 'DONE', 'priority' => 'LOW', 'due_date' => now()->subDays(2)->format('Y-m-d')],
                ['title' => 'Nâng cấp chức năng lọc task', 'description' => 'Thêm bộ lọc theo trạng thái, mức ưu tiên và người phụ trách.', 'status' => 'TODO', 'priority' => 'MEDIUM', 'due_date' => now()->addDays(5)->format('Y-m-d')],
                ['title' => 'Tạo báo cáo tiến độ sprint', 'description' => 'Tổng hợp tiến độ hoàn thành công việc và rủi ro của đội.', 'status' => 'IN_PROGRESS', 'priority' => 'MEDIUM', 'due_date' => now()->addDays(6)->format('Y-m-d')],
                ['title' => 'Tối ưu hiệu suất query', 'description' => 'Cải thiện thời gian trả về dữ liệu của các API danh sách lớn.', 'status' => 'DONE', 'priority' => 'HIGH', 'due_date' => now()->subDays(3)->format('Y-m-d')],
                ['title' => 'Dọn dẹp code và refactor', 'description' => 'Loại bỏ đoạn code trùng lặp và cập nhật naming convention.', 'status' => 'TODO', 'priority' => 'LOW', 'due_date' => now()->addDays(7)->format('Y-m-d')],
            ];

            foreach ($taskTemplates as $task) {
                Task::create([
                    'user_id' => $user->id,
                    'title' => $task['title'],
                    'description' => $task['description'],
                    'status' => $task['status'],
                    'priority' => $task['priority'],
                    'due_date' => $task['due_date'],
                ]);
            }
        }
    }
}

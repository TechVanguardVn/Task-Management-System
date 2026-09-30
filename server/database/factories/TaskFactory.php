<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = fake('vi_VN');

        return [
            'user_id' => User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id,
            'title' => $faker->randomElement([
                'Lập kế hoạch sprint',
                'Hoàn thiện giao diện dashboard',
                'Sửa lỗi đăng nhập',
                'Viết API lấy danh sách task',
                'Kiểm tra chức năng thanh toán',
                'Cập nhật báo cáo tiến độ',
                'Tạo mockup màn hình mobile',
                'Nâng cấp tính năng lọc task',
                'Chuẩn bị tài liệu hướng dẫn',
                'Review code tính năng upload file',
            ]),
            'description' => $faker->randomElement([
                'Cần hoàn thành các bước chuẩn bị cho phiên làm việc sáng mai.',
                'Đảm bảo tính đúng đắn của dữ liệu và luồng xử lý khi người dùng nhấn nút lưu.',
                'Cần kiểm tra lại các edge case liên quan đến trạng thái task và quyền truy cập.',
                'Thực hiện tối ưu giao diện để cải thiện trải nghiệm người dùng trên màn hình lớn.',
                'Hợp nhất nội dung từ team và cập nhật tài liệu triển khai mới nhất.',
            ]),
            'status' => $faker->randomElement(['TODO', 'IN_PROGRESS', 'DONE']),
            'priority' => $faker->randomElement(['LOW', 'MEDIUM', 'HIGH']),
            'due_date' => $faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
        ];
    }
}

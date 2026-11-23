/**
 * Seed dữ liệu mẫu (chạy lại nhiều lần được - idempotent):
 *   - demo@taskflow.dev / Demo@1234   : ~24 task đủ trạng thái, ưu tiên, hạn
 *   - alice@taskflow.dev / Alice@1234 : vài task để kiểm tra phân quyền dữ liệu
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();
const DAY = 24 * 3600 * 1000;

/** Hạn hoàn thành: N ngày kể từ hôm nay, lúc 17:00 */
function due(days: number | null) {
  if (days === null) return null;
  const d = new Date(Date.now() + days * DAY);
  d.setHours(17, 0, 0, 0);
  return d;
}

type SeedTask = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueIn: number | null;
  tags: string[];
};

const { TODO, IN_PROGRESS, DONE } = TaskStatus;
const { LOW, MEDIUM, HIGH } = TaskPriority;

const demoTasks: SeedTask[] = [
  { title: 'Product Redesign', description: 'Thiết kế lại trang sản phẩm theo brand guideline mới.', status: TODO, priority: MEDIUM, dueIn: 1, tags: ['ui', 'design'] },
  { title: 'Viết tài liệu API cho module Task', description: 'Bổ sung ví dụ request/response vào Swagger.', status: TODO, priority: HIGH, dueIn: 2, tags: ['docs', 'backend'] },
  { title: 'Chuẩn bị slide demo sprint', status: TODO, priority: LOW, dueIn: 5, tags: ['meeting'] },
  { title: 'Nghiên cứu thư viện biểu đồ', description: 'So sánh Recharts, Chart.js và ECharts.', status: TODO, priority: LOW, dueIn: 12, tags: ['research'] },
  { title: 'Thiết lập monitoring cho server', status: TODO, priority: HIGH, dueIn: -2, tags: ['devops'] },
  { title: 'Review hợp đồng với đối tác', status: TODO, priority: MEDIUM, dueIn: null, tags: ['admin'] },
  { title: 'Dịch giao diện sang tiếng Anh', status: TODO, priority: LOW, dueIn: 20, tags: ['i18n'] },
  { title: 'Lên kế hoạch onboarding nhân sự mới', status: TODO, priority: MEDIUM, dueIn: 6, tags: ['hr'] },
  { title: 'Mobile App Beta', description: 'Phát hành bản beta trên TestFlight và Google Play nội bộ.', status: IN_PROGRESS, priority: HIGH, dueIn: 3, tags: ['mobile', 'release'] },
  { title: 'Performance Optimization', description: 'Giảm thời gian tải trang chủ xuống dưới 2s.', status: IN_PROGRESS, priority: MEDIUM, dueIn: 0, tags: ['ui', 'performance'] },
  { title: 'Tích hợp thanh toán', status: IN_PROGRESS, priority: HIGH, dueIn: -1, tags: ['backend', 'payment'] },
  { title: 'Viết unit test cho AuthService', status: IN_PROGRESS, priority: MEDIUM, dueIn: 4, tags: ['testing'] },
  { title: 'Thiết kế email template', status: IN_PROGRESS, priority: LOW, dueIn: 9, tags: ['design', 'email'] },
  { title: 'API Integration for Tasks', description: 'Kết nối frontend với REST API.', status: DONE, priority: MEDIUM, dueIn: -3, tags: ['ui', 'design'] },
  { title: 'Thiết lập CI với GitHub Actions', status: DONE, priority: HIGH, dueIn: -5, tags: ['devops'] },
  { title: 'Thiết kế database schema', status: DONE, priority: HIGH, dueIn: -8, tags: ['backend', 'database'] },
  { title: 'Khởi tạo repository', status: DONE, priority: LOW, dueIn: -10, tags: ['setup'] },
  { title: 'Phỏng vấn người dùng', status: DONE, priority: MEDIUM, dueIn: -6, tags: ['research'] },
  { title: 'Wireframe màn hình Dashboard', status: DONE, priority: MEDIUM, dueIn: -4, tags: ['design'] },
  { title: 'Cấu hình Docker Compose', status: DONE, priority: MEDIUM, dueIn: -2, tags: ['devops'] },
  { title: 'Sửa lỗi hiển thị trên Safari', status: TODO, priority: HIGH, dueIn: 1, tags: ['bug', 'ui'] },
  { title: 'Tối ưu truy vấn danh sách task', status: TODO, priority: MEDIUM, dueIn: 8, tags: ['backend', 'performance'] },
  { title: 'Cập nhật README', status: IN_PROGRESS, priority: LOW, dueIn: 2, tags: ['docs'] },
  { title: 'Backup dữ liệu định kỳ', status: TODO, priority: MEDIUM, dueIn: 14, tags: ['devops'] },
];

const aliceTasks: SeedTask[] = [
  { title: '[Alice] Báo cáo tài chính quý', status: TODO, priority: HIGH, dueIn: 3, tags: ['finance'] },
  { title: '[Alice] Đặt phòng họp', status: DONE, priority: LOW, dueIn: -1, tags: ['admin'] },
];

async function seedUser(email: string, name: string, password: string, tasks: SeedTask[]) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });

  await prisma.task.deleteMany({ where: { userId: user.id } });

  const positions: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  await prisma.task.createMany({
    data: tasks.map((t) => ({
      userId: user.id,
      title: t.title,
      description: t.description ?? null,
      status: t.status,
      priority: t.priority,
      dueDate: due(t.dueIn),
      tags: t.tags,
      position: positions[t.status]++,
      completedAt: t.status === DONE ? new Date(Date.now() - DAY) : null,
    })),
  });
  console.log(`✔ ${email} (${tasks.length} tasks)`);
}

async function main() {
  await seedUser('demo@taskflow.dev', 'Demo User', 'Demo@1234', demoTasks);
  await seedUser('alice@taskflow.dev', 'Alice Nguyen', 'Alice@1234', aliceTasks);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

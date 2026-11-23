import 'dotenv/config';
import { execSync } from 'node:child_process';

/** Chạy migration lên database test một lần trước toàn bộ test suite */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Cần cấu hình TEST_DATABASE_URL để chạy integration test');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}

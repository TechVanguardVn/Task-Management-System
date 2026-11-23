/**
 * Khởi chạy PostgreSQL "nhúng" (embedded-postgres) cho máy không có Docker / Postgres.
 * Thông tin kết nối được đọc từ DATABASE_URL trong .env, nên chỉ cần:
 *   npm run db:local     (giữ terminal này mở)
 * rồi ở terminal khác: npm run db:migrate && npm run db:seed && npm run dev
 *
 * Tham số: --test  -> tạo thêm database cho test (TEST_DATABASE_URL)
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

function parse(url: string) {
  const u = new URL(url);
  return {
    user: decodeURIComponent(u.username || 'postgres'),
    password: decodeURIComponent(u.password || 'postgres'),
    port: Number(u.port || 5432),
    database: u.pathname.replace(/^\//, '') || 'postgres',
  };
}

async function main() {
  const mainUrl = process.env.DATABASE_URL;
  if (!mainUrl) throw new Error('DATABASE_URL chưa được cấu hình (.env)');
  const conn = parse(mainUrl);
  const databaseDir = path.resolve(__dirname, '..', '.local-pg');

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: conn.user,
    password: conn.password,
    port: conn.port,
    persistent: true,
    // ICU locale: so khớp không phân biệt hoa/thường đúng với tiếng Việt (ILIKE "thiết" ~ "THIẾT")
    initdbFlags: ['--encoding=UTF8', '--locale-provider=icu', '--icu-locale=und', '--locale=C'],
    onLog: () => {},
  });

  if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
    console.log('> Khởi tạo cluster PostgreSQL tại', databaseDir);
    await pg.initialise();
  }
  await pg.start();

  const databases = [conn.database];
  if (process.env.TEST_DATABASE_URL) databases.push(parse(process.env.TEST_DATABASE_URL).database);
  for (const db of databases) {
    try {
      await pg.createDatabase(db);
      console.log(`> Đã tạo database "${db}"`);
    } catch {
      // database đã tồn tại
    }
  }

  console.log(`> PostgreSQL đang chạy tại localhost:${conn.port} (Ctrl+C để dừng)`);

  const shutdown = async () => {
    console.log('\n> Đang dừng PostgreSQL...');
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

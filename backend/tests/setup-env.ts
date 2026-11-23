import 'dotenv/config';

// Phải chạy trước khi import src/config/env.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.BCRYPT_ROUNDS = '4'; // tăng tốc test
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-123456';

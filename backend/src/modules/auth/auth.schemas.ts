import { z } from 'zod';

const email = z
  .string({ required_error: 'Email là bắt buộc' })
  .trim()
  .toLowerCase()
  .max(255)
  .email('Email không hợp lệ');

export const registerSchema = z.object({
  name: z.string({ required_error: 'Tên là bắt buộc' }).trim().min(1, 'Tên không được để trống').max(100),
  email,
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    // bcrypt chỉ dùng 72 byte đầu tiên
    .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte')
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Mật khẩu phải chứa cả chữ và số'),
});

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(1, 'Mật khẩu là bắt buộc'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

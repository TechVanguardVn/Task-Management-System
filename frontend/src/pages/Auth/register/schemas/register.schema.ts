import { z } from 'zod'
import { PASSWORD_REGEX } from '@/pages/Auth/_shared/constants/auth.constants'

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên ít nhất 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .trim(),
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu ít nhất 8 ký tự')
    .regex(PASSWORD_REGEX, 'Mật khẩu phải có chữ hoa, chữ thường và số'),
})

export type RegisterFormValues = z.infer<typeof registerSchema>

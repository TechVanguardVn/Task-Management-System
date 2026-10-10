import { z } from 'zod'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const registerSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z
      .string()
      .min(8)
      .regex(passwordRegex, 'Password must contain uppercase, lowercase, and a number'),
    fullName: z.string().min(2).max(100).trim(),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
})

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
})

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
})

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.email(),
    otp: z.string().length(6),
  }),
})

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.email(),
  }),
})

export const googleOAuthSchema = z.object({
  body: z.object({
    code: z.string().min(1),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body']
export type ResendOtpInput = z.infer<typeof resendOtpSchema>['body']
export type GoogleOAuthInput = z.infer<typeof googleOAuthSchema>['body']

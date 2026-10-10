import { z } from 'zod'
import { VERIFY_EMAIL_CONSTANTS } from '../constants/verify-email.constants'

export const verifyEmailSchema = z.object({
  otp: z.string().length(6, VERIFY_EMAIL_CONSTANTS.MESSAGES.OTP_LENGTH_ERROR),
})

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

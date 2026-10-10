import { useNavigate } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { useVerifyEmailMutation, useResendOtpMutation } from '@/services/queries/auth.query'
import { setCredentials } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { VERIFY_EMAIL_CONSTANTS } from '../constants/verify-email.constants'
import type { VerifyEmailFormValues } from '../schemas/verify-email.schema'

export function useVerifyEmail(email: string) {
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { mutateAsync: verifyEmailAsync, isPending: isVerifying } = useVerifyEmailMutation()
  const { mutateAsync: resendOtpAsync, isPending: isResending } = useResendOtpMutation()

  const verifyEmail = async (values: VerifyEmailFormValues) => {
    try {
      const data = await verifyEmailAsync({ email, otp: values.otp })
      
      dispatch(setCredentials({ 
        accessToken: data.data.accessToken, 
        refreshToken: data.data.refreshToken, 
        user: data.data.user 
      }))
      
      message.success(VERIFY_EMAIL_CONSTANTS.MESSAGES.VERIFY_SUCCESS)
      navigate('/dashboard')
    } catch (err: any) {
      message.error(err.message || VERIFY_EMAIL_CONSTANTS.MESSAGES.VERIFY_ERROR)
    }
  }

  const resendOtp = async () => {
    try {
      await resendOtpAsync({ email })
      message.success(VERIFY_EMAIL_CONSTANTS.MESSAGES.RESEND_SUCCESS)
    } catch (err: any) {
      message.error(err.message || VERIFY_EMAIL_CONSTANTS.MESSAGES.RESEND_ERROR)
    }
  }

  return {
    verifyEmail,
    resendOtp,
    isVerifying,
    isResending,
  }
}

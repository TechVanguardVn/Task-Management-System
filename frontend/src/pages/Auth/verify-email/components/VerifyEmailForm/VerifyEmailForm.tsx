import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, Navigate } from 'react-router-dom'
import { Form, Input } from 'antd'
import { GlassCard } from '@/pages/Auth/_shared/components/GlassCard/GlassCard'
import { TechLogo } from '@/components/ui/TechLogo/TechLogo'
import { FormFieldLabel } from '@/pages/Auth/login/components/FormField/FormFieldLabel'
import { LiquidButton } from '@/components/ui/LiquidButton/LiquidButton'
import { useVerifyEmail } from '../../hooks/useVerifyEmail'
import { VERIFY_EMAIL_CONSTANTS } from '../../constants/verify-email.constants'
import { verifyEmailSchema, type VerifyEmailFormValues } from '../../schemas/verify-email.schema'
import { ResendCode } from '../ResendCode/ResendCode'

export function VerifyEmailForm() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const { verifyEmail, resendOtp, isVerifying, isResending } = useVerifyEmail(email)

  const { control, handleSubmit, formState: { errors } } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: '' },
  })

  if (!email) {
    return <Navigate to="/register" replace />
  }

  return (
    <GlassCard className="w-full max-w-[420px] p-8 md:p-10 mx-auto mt-[-5vh]">
      <div className="flex items-center justify-between mb-8">
        <TechLogo size={32} />
        <h1 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f] m-0 leading-tight">
          {VERIFY_EMAIL_CONSTANTS.TITLE}
        </h1>
      </div>

      <div className="text-center mb-6">
        <p className="text-[15px] text-[rgba(60,60,67,0.7)] leading-relaxed">
          {VERIFY_EMAIL_CONSTANTS.DESCRIPTION_PREFIX} <br/>
          <strong className="text-[#1d1d1f] font-medium">{email}</strong>
        </p>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(verifyEmail)} requiredMark={false} className="flex flex-col gap-[18px]">
        <div className="flex flex-col items-center auth-input-wrapper">
          <FormFieldLabel label={VERIFY_EMAIL_CONSTANTS.OTP_LABEL} />
          <Controller
            name="otp"
            control={control}
            render={({ field }) => (
              <Form.Item validateStatus={errors.otp ? 'error' : ''} help={errors.otp?.message} className="w-full text-center">
                <Input.OTP 
                  {...field} 
                  length={6} 
                  size="large"
                  autoFocus 
                  style={{ gap: '12px', justifyContent: 'center' }}
                />
              </Form.Item>
            )}
          />
        </div>

        <div className="pt-2">
          <LiquidButton type="submit" loading={isVerifying} disabled={isVerifying}>
            {VERIFY_EMAIL_CONSTANTS.VERIFY_BUTTON}
          </LiquidButton>
        </div>
      </Form>

      <ResendCode onResend={resendOtp} isResending={isResending} />
    </GlassCard>
  )
}

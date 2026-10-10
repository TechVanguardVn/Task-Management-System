import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input } from 'antd'
import { Link } from 'react-router-dom'
import { loginSchema, type LoginFormValues } from '@/pages/Auth/login/schemas/login.schema'
import { useLogin } from '@/pages/Auth/login/hooks/useLogin'
import { GlassCard } from '@/pages/Auth/_shared/components/GlassCard/GlassCard'
import { GlassInputWrapper } from '@/pages/Auth/_shared/components/GlassInput/GlassInputWrapper'
import { LiquidButton } from '@/components/ui/LiquidButton/LiquidButton'
import { FormFieldLabel } from '../FormField/FormFieldLabel'
import { SsoOptions } from '../SsoOptions/SsoOptions'
import { TechLogo } from '@/components/ui/TechLogo/TechLogo'

export function LoginForm() {
  const { login, isPending } = useLogin()

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-7">
        <TechLogo size={48} />
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Đăng nhập
        </h1>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(login)} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <FormFieldLabel label="Email" />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <GlassInputWrapper hasError={!!errors.email} errorMessage={errors.email?.message}>
                <Input
                  {...field}
                  type="email"
                  placeholder="ten@congty.com"
                  bordered={false}
                />
              </GlassInputWrapper>
            )}
          />
        </div>

        <div className="flex flex-col">
          <FormFieldLabel
            label="Mật khẩu"
            rightSlot={
              <Link
                to="/forgot-password"
                style={{ fontSize: '13px', color: '#007aff', textDecoration: 'none', transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Quên mật khẩu?
              </Link>
            }
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <GlassInputWrapper hasError={!!errors.password} errorMessage={errors.password?.message}>
                <Input.Password
                  {...field}
                  placeholder="Mật khẩu"
                  bordered={false}
                />
              </GlassInputWrapper>
            )}
          />
        </div>

        <div className="pt-1">
          <LiquidButton type="submit" loading={isPending}>
            Đăng nhập
          </LiquidButton>
        </div>

        <div className="relative flex items-center">
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
          <span style={{ padding: '0 12px', fontSize: '12px', color: 'rgba(60,60,67,0.45)' }}>hoặc</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        </div>

        <SsoOptions />

        <p style={{ fontSize: '13px', textAlign: 'center', color: 'rgba(60,60,67,0.6)' }}>
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            style={{ color: '#007aff', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Đăng ký
          </Link>
        </p>
      </Form>
    </GlassCard>
  )
}

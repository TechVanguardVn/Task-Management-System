import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, Input } from 'antd'
import { Link } from 'react-router-dom'
import { registerSchema, type RegisterFormValues } from '@/pages/Auth/register/schemas/register.schema'
import { useRegister } from '@/pages/Auth/register/hooks/useRegister'
import { GlassCard } from '@/pages/Auth/_shared/components/GlassCard/GlassCard'
import { GlassInputWrapper } from '@/pages/Auth/_shared/components/GlassInput/GlassInputWrapper'
import { LiquidButton } from '@/components/ui/LiquidButton/LiquidButton'
import { TechLogo } from '@/components/ui/TechLogo/TechLogo'

const fieldLabelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'rgba(60, 60, 67, 0.7)',
  letterSpacing: '-0.005em',
  marginBottom: '8px',
}

export function RegisterForm() {
  const { register, isPending } = useRegister()

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
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
          Tạo tài khoản
        </h1>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(register)} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label style={fieldLabelStyle}>Họ và tên</label>
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <GlassInputWrapper hasError={!!errors.fullName} errorMessage={errors.fullName?.message}>
                <Input
                  {...field}
                  placeholder="Nguyễn Văn A"
                  prefix={<span className="material-symbols-outlined text-lg mr-2" style={{ color: 'rgba(60,60,67,0.45)' }}>person</span>}
                  bordered={false}
                />
              </GlassInputWrapper>
            )}
          />
        </div>

        <div className="flex flex-col">
          <label style={fieldLabelStyle}>Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <GlassInputWrapper hasError={!!errors.email} errorMessage={errors.email?.message}>
                <Input
                  {...field}
                  type="email"
                  placeholder="ten@congty.com"
                  prefix={<span className="material-symbols-outlined text-lg mr-2" style={{ color: 'rgba(60,60,67,0.45)' }}>mail</span>}
                  bordered={false}
                />
              </GlassInputWrapper>
            )}
          />
        </div>

        <div className="flex flex-col">
          <label style={fieldLabelStyle}>Mật khẩu</label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <GlassInputWrapper hasError={!!errors.password} errorMessage={errors.password?.message}>
                <Input.Password
                  {...field}
                  placeholder="Ít nhất 8 ký tự, có chữ hoa và số"
                  prefix={<span className="material-symbols-outlined text-lg mr-2" style={{ color: 'rgba(60,60,67,0.45)' }}>lock</span>}
                  bordered={false}
                />
              </GlassInputWrapper>
            )}
          />
        </div>

        <div className="pt-2">
          <LiquidButton type="submit" loading={isPending}>
            Tạo tài khoản
            <span className="material-symbols-outlined text-lg" style={{ transition: 'transform 0.2s' }}>
              arrow_forward
            </span>
          </LiquidButton>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)' }}>
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              style={{ color: '#007aff', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </Form>
    </GlassCard>
  )
}

import { Link } from 'react-router'
import { useAuthForm } from '../../hooks/useAuthForm.js'
import { AuthField } from './AuthField.jsx'
import { AuthIcon } from './AuthIcon.jsx'
import { PasswordRequirements } from './PasswordRequirements.jsx'

export function AuthForm({ mode }) {
  const register = mode === 'register'
  const { values, errors, pending, change, blur, submit } = useAuthForm(mode)
  const shared = { onChange: change, onBlur: blur }
  return (
    <>
      <div className="auth-heading">
        <span className="auth-kicker">
          <span aria-hidden="true" />
          Không gian làm việc của bạn
        </span>
        <h1 id="auth-title">
          {register ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
        </h1>
        <p>
          {register
            ? 'Bắt đầu quản lý dự án và công việc của bạn, tất cả trong một không gian.'
            : 'Đăng nhập để tiếp tục với dự án và công việc của bạn.'}
        </p>
      </div>
      <form
        className="auth-form"
        onSubmit={submit}
        noValidate
        aria-busy={pending}
      >
        <fieldset disabled={pending}>
          <legend className="sr-only">
            {register ? 'Thông tin đăng ký' : 'Thông tin đăng nhập'}
          </legend>
          {register && (
            <AuthField
              {...shared}
              name="name"
              label="Họ và tên"
              icon="user"
              autoComplete="name"
              maxLength={120}
              placeholder="Nhập họ và tên của bạn"
              value={values.name}
              error={errors.name}
            />
          )}
          <AuthField
            {...shared}
            name="email"
            label="Email"
            type="email"
            icon="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            placeholder="ban@example.com"
            value={values.email}
            error={errors.email}
          />
          <div>
            <AuthField
              {...shared}
              name="password"
              label="Mật khẩu"
              type="password"
              icon="lock"
              autoComplete={register ? 'new-password' : 'current-password'}
              placeholder={
                register ? 'Tạo mật khẩu của bạn' : 'Nhập mật khẩu của bạn'
              }
              value={values.password}
              error={errors.password}
              hintId={register ? 'password-requirements' : undefined}
            />
            {register && <PasswordRequirements password={values.password} />}
          </div>
          {register && (
            <AuthField
              {...shared}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              icon="lock"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              value={values.confirmPassword}
              error={errors.confirmPassword}
            />
          )}
        </fieldset>
        <button type="submit" className="auth-submit" disabled={pending}>
          {pending ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              {register ? 'Đang tạo tài khoản…' : 'Đang đăng nhập…'}
            </>
          ) : (
            <>
              {register ? 'Đăng ký tài khoản' : 'Đăng nhập'}
              <AuthIcon name="arrow" />
            </>
          )}
        </button>
      </form>
      <p className="auth-switch">
        {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
        <Link to={register ? '/login' : '/register'}>
          {register ? 'Đăng nhập' : 'Đăng ký ngay'}
        </Link>
      </p>
    </>
  )
}

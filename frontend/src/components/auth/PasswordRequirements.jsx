import { passwordRequirements } from './validation.js'
import { AuthIcon } from './AuthIcon.jsx'

export function PasswordRequirements({ password }) {
  const requirements = passwordRequirements(password)
  const satisfied = requirements.filter(({ met }) => met).length
  return (
    <div className="auth-requirements" id="password-requirements">
      <div className="auth-requirements-heading">
        <span>Yêu cầu mật khẩu</span>
        <span>
          {!password
            ? 'Chưa nhập'
            : satisfied === requirements.length
              ? 'Hợp lệ'
              : 'Chưa hợp lệ'}
        </span>
      </div>
      <div className="auth-requirements-bars" aria-hidden="true">
        {requirements.map(({ label, met }) => (
          <span key={label} className={met ? 'is-met' : ''} />
        ))}
      </div>
      <ul>
        {requirements.map(({ label, met }) => (
          <li key={label} className={met ? 'is-met' : ''}>
            <span className="auth-requirement-check">
              {met && <AuthIcon name="check" />}
            </span>
            <span>
              {label}
              <span className="sr-only">
                {met ? ' — đã đạt' : ' — chưa đạt'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

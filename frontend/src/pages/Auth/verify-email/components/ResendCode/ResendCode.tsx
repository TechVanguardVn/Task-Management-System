import { VERIFY_EMAIL_CONSTANTS } from '../../constants/verify-email.constants'

interface ResendCodeProps {
  onResend: () => void
  isResending: boolean
}

export function ResendCode({ onResend, isResending }: ResendCodeProps) {
  return (
    <div className="mt-8 text-center">
      <p className="text-[13px] text-[rgba(60,60,67,0.7)]">
        {VERIFY_EMAIL_CONSTANTS.NOT_RECEIVED}{' '}
        <button 
          type="button" 
          onClick={onResend}
          disabled={isResending}
          className="text-[#007aff] hover:opacity-75 transition-opacity font-medium bg-transparent border-none cursor-pointer disabled:opacity-50"
        >
          {VERIFY_EMAIL_CONSTANTS.RESEND_BUTTON}
        </button>
      </p>
    </div>
  )
}

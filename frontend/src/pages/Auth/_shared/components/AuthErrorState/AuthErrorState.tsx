interface AuthErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function AuthErrorState({ message = 'Không thể kết nối máy chủ. Vui lòng thử lại.', onRetry }: AuthErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <span className="material-symbols-outlined text-5xl text-rose-400">wifi_off</span>
      <p className="text-sm text-slate-600 font-medium max-w-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}

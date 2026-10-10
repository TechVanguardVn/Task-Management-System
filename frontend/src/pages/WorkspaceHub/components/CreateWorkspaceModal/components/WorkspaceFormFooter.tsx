interface WorkspaceFormFooterProps {
  onCancel: () => void
  isSubmitting: boolean
}

export const WorkspaceFormFooter = ({ onCancel, isSubmitting }: WorkspaceFormFooterProps) => {
  return (
    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/50 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          </>
        ) : (
          'Create Workspace'
        )}
      </button>
    </div>
  )
}

import { Form, Input } from 'antd'
import { Controller } from 'react-hook-form'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useCreateWorkspace } from '../../hooks/useCreateWorkspace'
import { WORKSPACE_TEXTS } from '../../constants/workspace.constants'

interface Props {
  onBack: () => void
}

export const WorkspaceCreate = ({ onBack }: Props) => {
  const { form, onSubmit, isSubmitting } = useCreateWorkspace()

  return (
    <div className="max-w-xl mx-auto mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>{WORKSPACE_TEXTS.backToOptions}</span>
      </button>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-7 shadow-sm border border-white/80">
        <Form layout="vertical" onFinish={form.handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {WORKSPACE_TEXTS.create.workspaceNameLabel}
            </label>
            <div className="relative">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Input 
                      {...field}
                      size="large"
                      placeholder={WORKSPACE_TEXTS.create.workspaceNamePlaceholder}
                      className="bg-white/80 border-white/60 shadow-inner px-4 py-3 rounded-xl focus:bg-white"
                      status={fieldState.error ? 'error' : ''}
                    />
                    {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                  </>
                )}
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{WORKSPACE_TEXTS.create.submitting}</span>
                </>
              ) : (
                <>
                  <span>{WORKSPACE_TEXTS.create.submit}</span>
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl text-sm font-semibold text-slate-600 bg-white/70 hover:bg-white border border-white/80 shadow-sm transition-colors"
            >
              {WORKSPACE_TEXTS.create.cancel}
            </button>
          </div>
        </Form>
      </div>
    </div>
  )
}

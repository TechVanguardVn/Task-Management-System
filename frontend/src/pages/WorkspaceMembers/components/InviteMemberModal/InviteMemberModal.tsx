import { Modal, Form, Input } from 'antd'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { MEMBERS_TEXTS } from '../../constants/members.constants'
import { inviteMemberSchema, type InviteMemberFormData } from '../../schemas/members.schema'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InviteMemberFormData) => void
}

export const InviteMemberModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER'
    }
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFormSubmit = (data: InviteMemberFormData) => {
    onSubmit(data)
    reset()
  }

  const roleOptions = [
    { id: 'ADMIN', ...MEMBERS_TEXTS.inviteModal.roles.admin, color: 'rose' },
    { id: 'MEMBER', ...MEMBERS_TEXTS.inviteModal.roles.member, color: 'indigo' },
  ] as const

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={480}
      className="glass-modal"
      centered
    >
      <div className="flex flex-col gap-6 p-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{MEMBERS_TEXTS.inviteModal.title}</h2>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {MEMBERS_TEXTS.inviteModal.emailLabel}
            </label>
            <div className="relative">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <>
                    <Input 
                      {...field}
                      size="large"
                      placeholder={MEMBERS_TEXTS.inviteModal.emailPlaceholder}
                      className="bg-slate-50/50 border-slate-200 shadow-inner px-3 py-2.5 rounded-xl focus:bg-white"
                      status={errors.email ? 'error' : ''}
                      prefix={<Mail size={18} className="text-slate-400 mr-1.5" />}
                    />
                  </>
                )}
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {MEMBERS_TEXTS.inviteModal.roleLabel}
            </label>
            <div className="flex flex-col gap-2">
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <>
                    {roleOptions.map((role) => (
                      <div 
                        key={role.id}
                        onClick={() => field.onChange(role.id)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${
                          field.value === role.id 
                            ? 'bg-indigo-50/60 border-indigo-400 shadow-sm' 
                            : 'bg-white/50 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            field.value === role.id ? 'border-indigo-600' : 'border-slate-300'
                          }`}>
                            {field.value === role.id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{role.title}</span>
                            <span className="text-xs text-slate-500">{role.desc}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              />
            </div>
            {errors.role && <p className="text-red-500 text-xs mt-1.5">{errors.role.message}</p>}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button 
              type="submit"
              className="flex-1 py-3 px-5 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
            >
              {MEMBERS_TEXTS.inviteModal.submitBtn}
            </button>
            <button 
              type="button"
              onClick={handleClose}
              className="w-1/3 py-3 px-5 rounded-xl text-sm font-semibold text-slate-600 bg-white/70 hover:bg-white border border-slate-200 shadow-sm transition-colors"
            >
              {MEMBERS_TEXTS.inviteModal.cancelBtn}
            </button>
          </div>
        </Form>
      </div>
    </Modal>
  )
}

import { Modal, Form } from 'antd'
import { Controller } from 'react-hook-form'
import { MEMBERS_TEXTS } from '../../constants/members.constants'
import type { MemberRole, WorkspaceMember } from '../../types/members.types'
import { useChangeRoleModal } from './useChangeRoleModal'

interface Props {
  isOpen: boolean
  onClose: () => void
  member: WorkspaceMember | null
  onSubmit: (memberId: string, role: MemberRole) => void
}

export const ChangeRoleModal = ({ isOpen, onClose, member, onSubmit }: Props) => {
  const { control, handleSubmit, handleClose, handleFormSubmit } = useChangeRoleModal({ member, onSubmit, onClose })

  const roleOptions = [
    { id: 'OWNER', ...MEMBERS_TEXTS.inviteModal.roles.owner, color: 'amber' },
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
        <header>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{MEMBERS_TEXTS.changeRoleModal.title}</h2>
          {member && <p className="text-sm text-slate-500 mt-1">Updating role for <span className="font-semibold text-slate-700">{member.fullName}</span> ({member.email})</p>}
        </header>

        <Form layout="vertical" onFinish={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
          <section>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {MEMBERS_TEXTS.changeRoleModal.roleLabel}
            </label>
            <div className="flex flex-col gap-2">
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <>
                    {roleOptions.map((role) => (
                      <article 
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
                      </article>
                    ))}
                  </>
                )}
              />
            </div>
          </section>

          <footer className="flex items-center gap-3 mt-2">
            <button 
              type="submit"
              className="flex-1 py-3 px-5 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
            >
              {MEMBERS_TEXTS.changeRoleModal.submitBtn}
            </button>
            <button 
              type="button"
              onClick={handleClose}
              className="w-1/3 py-3 px-5 rounded-xl text-sm font-semibold text-slate-600 bg-white/70 hover:bg-white border border-slate-200 shadow-sm transition-colors"
            >
              {MEMBERS_TEXTS.changeRoleModal.cancelBtn}
            </button>
          </footer>
        </Form>
      </div>
    </Modal>
  )
}

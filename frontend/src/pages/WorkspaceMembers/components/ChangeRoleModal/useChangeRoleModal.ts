import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { MemberRole, WorkspaceMember } from '../../types/members.types'

interface UseChangeRoleModalProps {
  member: WorkspaceMember | null
  onSubmit: (memberId: string, role: MemberRole) => void
  onClose: () => void
}

export const useChangeRoleModal = ({ member, onSubmit, onClose }: UseChangeRoleModalProps) => {
  const { control, handleSubmit, reset } = useForm<{ role: MemberRole }>({
    defaultValues: { role: 'MEMBER' }
  })

  useEffect(() => {
    if (member) {
      reset({ role: member.role })
    }
  }, [member, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFormSubmit = (data: { role: MemberRole }) => {
    if (member) {
      onSubmit(member.id, data.role)
    }
    handleClose()
  }

  return {
    control,
    handleSubmit,
    handleClose,
    handleFormSubmit
  }
}

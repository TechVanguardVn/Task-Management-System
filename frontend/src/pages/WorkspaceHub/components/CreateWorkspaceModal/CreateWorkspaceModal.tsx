import { Form } from 'antd'
import { useWorkspaceForm } from './hooks/useWorkspaceForm'
import { WorkspaceFormHeader } from './components/WorkspaceFormHeader'
import { WorkspaceFormFooter } from './components/WorkspaceFormFooter'
import { LogoUploadField } from './components/fields/LogoUploadField'
import { NameField } from './components/fields/NameField'
import { DescriptionField } from './components/fields/DescriptionField'

interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateWorkspaceModal = ({ isOpen, onClose }: CreateWorkspaceModalProps) => {
  const { formData, errors, isSubmitting, updateField, handleSubmit } = useWorkspaceForm(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-lg bg-white/80 backdrop-blur-3xl border border-white/80 rounded-[32px] shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.95)] overflow-hidden transform transition-all duration-300">
        
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none"></div>

        <WorkspaceFormHeader onClose={onClose} />

        <Form onSubmitCapture={handleSubmit} layout="vertical">
          <div className="p-6 sm:p-8 space-y-6">
            
            <LogoUploadField />

            <div className="space-y-4">
              <NameField 
                value={formData.name} 
                onChange={(val) => updateField('name', val)} 
                error={errors.name} 
              />
              <DescriptionField 
                value={formData.description || ''} 
                onChange={(val) => updateField('description', val)} 
                error={errors.description}
              />
            </div>

            <WorkspaceFormFooter 
              onCancel={onClose} 
              isSubmitting={isSubmitting} 
            />
            
          </div>
        </Form>
      </div>
    </div>
  )
}

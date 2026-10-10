import { Building2, MailOpen } from 'lucide-react'
import { WorkspaceSelectionCard } from './WorkspaceSelectionCard'
import { SELECTION_OPTIONS } from '../../constants/workspace.constants'

interface Props {
  onSelectCreate: () => void
  onSelectInvite: () => void
}

const getIcon = (iconName: string) => {
  if (iconName === 'Building2') return <Building2 size={28} />
  if (iconName === 'MailOpen') return <MailOpen size={28} />
  return null
}

export const WorkspaceSelection = ({ onSelectCreate, onSelectInvite }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {SELECTION_OPTIONS.map(option => (
        <WorkspaceSelectionCard 
          key={option.id}
          icon={getIcon(option.iconName)}
          title={option.title}
          description={option.description}
          actionText={option.actionText}
          colorTheme={option.colorTheme}
          onClick={option.id === 'create' ? onSelectCreate : onSelectInvite}
        />
      ))}
    </div>
  )
}

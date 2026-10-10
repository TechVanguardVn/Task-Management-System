export type WorkspaceView = 'selection' | 'create' | 'invite'

export interface UserIdentity {
  email: string
  status: 'verified' | 'unverified'
}

export interface SelectionOption {
  id: 'create' | 'invite'
  title: string
  description: string
  actionText: string
  colorTheme: 'indigo' | 'violet'
  iconName: string
}

import { userInitials } from './userInitials.js'

export function UserAvatar({ name }) {
  return (
    <span className="user-avatar" aria-hidden="true">
      {userInitials(name)}
    </span>
  )
}

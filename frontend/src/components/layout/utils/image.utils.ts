export const getAvatarUrl = (avatarId: string | null | undefined): string => {
  if (!avatarId) return ''
  if (avatarId.startsWith('http')) return avatarId
  return `/avatars/${avatarId}`
}

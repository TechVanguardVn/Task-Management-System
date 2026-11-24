export function userInitials(name) {
  const words =
    typeof name === 'string'
      ? name.normalize('NFC').trim().split(/\s+/u).filter(Boolean)
      : []
  if (!words.length) return 'U'
  const first = [...words[0]][0]
  const last = words.length > 1 ? [...words.at(-1)][0] : ''
  return (first + last).toLocaleUpperCase('vi-VN')
}

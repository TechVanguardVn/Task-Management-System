import { useState } from 'react'

export const useCheckInvites = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const checkInvites = async () => {
    setIsChecking(true)
    setHasChecked(true)
    await new Promise(resolve => setTimeout(resolve, 1800))
    setIsChecking(false)
  }

  return {
    isChecking,
    hasChecked,
    checkInvites,
  }
}

import { useEffect } from 'react'

export function usePageTitle(title, brand = 'Task Management System') {
  useEffect(() => {
    document.title = `${title} | ${brand}`
  }, [title, brand])
}

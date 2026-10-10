import { useLocation } from 'react-router-dom'
import { MENU_KEYS, MENU_LABELS } from '../../AppSider/constants/menu.constants'

export const useDynamicTitle = () => {
  const location = useLocation()

  const matchedKey = Object.values(MENU_KEYS).find(key => location.pathname.startsWith(key))
  
  if (matchedKey) {
    return MENU_LABELS[matchedKey]
  }
  
  return 'TaskTMS'
}

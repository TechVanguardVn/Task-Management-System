import { Dropdown, Image } from 'antd'
import { User, Settings, LogOut, Laptop } from 'lucide-react'
import { useLogout } from '@/pages/Auth/_shared/hooks/useLogout'
import { useAppSelector } from '@/store/hooks'
import { getAvatarUrl } from '../../../../utils/image.utils'

export const UserDropdown = () => {
  const { user } = useAppSelector(state => state.auth)
  const { logout, logoutAll } = useLogout()

  const userInitials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 'profile',
            label: (
              <div className="flex items-center space-x-3 px-2 py-1 text-sm text-slate-600 group/item">
                <User className="w-4 h-4 group-hover/item:text-indigo-600" />
                <span>Profile Info</span>
              </div>
            ),
          },
          {
            key: 'settings',
            label: (
              <div className="flex items-center space-x-3 px-2 py-1 text-sm text-slate-600 group/item">
                <Settings className="w-4 h-4 group-hover/item:text-indigo-600" />
                <span>Settings</span>
              </div>
            ),
          },
          { type: 'divider' },
          {
            key: 'logout',
            label: (
              <div className="flex items-center space-x-3 px-2 py-1 text-sm text-red-500 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" />
                <span className="font-bold">Logout</span>
              </div>
            ),
            onClick: logout,
          },
          {
            key: 'logout-all',
            label: (
              <div className="flex items-center space-x-3 px-2 py-1 text-sm text-red-500 hover:text-red-600 transition-colors">
                <Laptop className="w-4 h-4" />
                <span className="font-bold">Logout All Devices</span>
              </div>
            ),
            onClick: logoutAll,
          },
        ],
      }}
      placement="bottomRight"
      trigger={['click']}
      classNames={{ root: 'bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl w-56' }}
    >
      <button className="flex items-center space-x-3 bg-transparent hover:bg-slate-50/50 rounded-full transition-all duration-300 p-1 pr-2">
        <div className="text-right hidden sm:flex flex-col">
          <span className="text-[14px] font-semibold text-slate-900 leading-tight">{user?.fullName || 'User Name'}</span>
          <span className="text-[12px] text-slate-500 font-medium">Member</span>
        </div>
        <div className="relative">
          {user?.avatar ? (
            <div className="w-9 h-9 rounded-full shadow-sm bg-white overflow-hidden flex items-center justify-center">
              <Image preview={false} src={getAvatarUrl(user.avatar)} alt="Avatar" className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-[14px]">{userInitials}</span>
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-[0_0_8px_rgba(5,150,105,0.5)]"></span>
        </div>
      </button>
    </Dropdown>
  )
}

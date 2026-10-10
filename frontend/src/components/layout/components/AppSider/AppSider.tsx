import { Layout, Menu as AntMenu } from 'antd'
import { Menu, LogOut } from 'lucide-react'
import { useSiderMenu } from './hooks/useSiderMenu'
import { useLogout } from '@/pages/Auth/_shared/hooks/useLogout'
import { TechLogo } from '@/components/ui/TechLogo/TechLogo'

const { Sider } = Layout

interface AppSiderProps {
  collapsed: boolean
  onToggle: () => void
}

export const AppSider = ({ collapsed, onToggle }: AppSiderProps) => {
  const { menuItems, handleMenuClick, selectedKey } = useSiderMenu()
  const { logout } = useLogout()

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      collapsedWidth={80}
      theme="light"
      style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: 'transparent' }}
      className="bg-white/70 backdrop-blur-3xl border-r border-slate-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 z-50"
    >
      <div className="h-full flex flex-col justify-between overflow-hidden p-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <TechLogo size={32} />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden whitespace-nowrap">
                <span className="text-lg font-bold tracking-tight text-slate-800 leading-tight">TechVanguardVn</span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ${collapsed ? 'mt-4' : ''}`}
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AntMenu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-r-0 text-slate-500 font-medium tracking-wide text-[14px] [&_.ant-menu-item]:!mb-2 [&_.ant-menu-item]:!mt-0 [&_.ant-menu-item-selected]:!bg-indigo-500/10 [&_.ant-menu-item-selected]:!text-indigo-600 [&_.ant-menu-item-selected]:!border [&_.ant-menu-item-selected]:!border-indigo-500/20 [&_.ant-menu-item-selected]:!rounded-xl [&_.ant-menu-item]:hover:!bg-slate-500/5 [&_.ant-menu-item]:hover:!text-slate-800 [&_.ant-menu-item]:!rounded-xl [&_.ant-menu-item]:!h-11"
            style={{ padding: 0, background: 'transparent' }}
          />
        </div>

        <div className="pt-4 mt-auto">
          <button
            onClick={logout}
            className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-[14px] text-rose-600 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-700 transition-all font-bold group`}
          >
            <LogOut size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.05);
            border-radius: 20px;
        }
      `}</style>
    </Sider>
  )
}

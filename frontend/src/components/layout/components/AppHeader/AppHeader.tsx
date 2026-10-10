import { UserDropdown } from './components/UserDropdown/UserDropdown'

export const AppHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/75 backdrop-blur-2xl border-b border-white/60 shadow-[0_4px_24px_-2px_rgba(15,23,42,0.04),inset_0_1px_0_0_rgba(255,255,255,0.8)] transition-all">
      <div className="h-20 w-full max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
        </div>

        <div className="flex items-center gap-6">
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}



interface Props {
  title: string
  description: string
  icon: React.ReactNode
  actionContent: React.ReactNode
  onClick?: () => void
  gradientClass: string
  iconShadowClass: string
  cardShadowHoverClass: string
}

export const WorkspaceActionCard = ({ 
  title, 
  description, 
  icon, 
  actionContent, 
  gradientClass,
  iconShadowClass,
  cardShadowHoverClass
}: Props) => {
  return (
    <div className={`group relative bg-white/40 backdrop-blur-xl rounded-2xl p-7 shadow-sm hover:bg-white/60 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${cardShadowHoverClass}`}>
      <div className="mb-8">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white mb-6 group-hover:scale-105 transition-transform ${iconShadowClass}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div>
        {actionContent}
      </div>
    </div>
  )
}

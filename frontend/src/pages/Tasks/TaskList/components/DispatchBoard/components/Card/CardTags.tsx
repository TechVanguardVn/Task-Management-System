interface CardTagsProps {
  tags?: string[]
}

export const CardTags = ({ tags }: CardTagsProps) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {tags.map(tag => (
        <span key={tag} className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
          {tag}
        </span>
      ))}
    </div>
  )
}

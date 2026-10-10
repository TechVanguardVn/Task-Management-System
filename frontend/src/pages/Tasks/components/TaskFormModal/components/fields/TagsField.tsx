

import { Select } from 'antd'

interface TagsFieldProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export const TagsField = ({ tags, onChange }: TagsFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Tags</label>
      <div className="w-full bg-white/80 border border-white/80 rounded-xl shadow-sm hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all flex items-center min-h-[44px]">
        <Select
          mode="tags"
          value={tags}
          onChange={onChange}
          variant="borderless"
          placeholder="Add tag..."
          className="w-full !min-h-[44px]"
          dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
          maxTagCount="responsive"
        />
      </div>
    </div>
  )
}

import { VIEW_TITLES, VIEW_SUBTITLES } from '../../constants/workspace.constants'
import type { WorkspaceView } from '../../types/workspace.types'

interface Props {
  view: WorkspaceView
}

export const WorkspaceHeader = ({ view }: Props) => {
  return (
    <div className="flex flex-col items-center text-center transition-all duration-300">
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight mt-5">
        {VIEW_TITLES[view]}
      </h1>
      {VIEW_SUBTITLES[view] && (
        <p className="text-slate-500 mt-2 text-lg">{VIEW_SUBTITLES[view]}</p>
      )}
    </div>
  )
}

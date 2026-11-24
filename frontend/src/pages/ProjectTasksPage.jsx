import { useParams } from 'react-router'
import { TaskWorkspace } from '../components/tasks/TaskWorkspace.jsx'

export function ProjectTasksPage() {
  const { projectId } = useParams()
  return <TaskWorkspace fixedProjectId={projectId} />
}

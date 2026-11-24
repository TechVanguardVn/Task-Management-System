import { formatCount, formatPercent } from './presentation.js'

export function CompletionOverview({ summary }) {
  return (
    <div className="dashboard-completion">
      <p className="dashboard-completion-number">
        {formatPercent(summary.completionPercentage)}
      </p>
      <p className="dashboard-muted">
        {formatCount(summary.doneTasks)} trên {formatCount(summary.totalTasks)}{' '}
        công việc đã hoàn thành
      </p>
      <div
        role="progressbar"
        aria-label="Tỷ lệ hoàn thành công việc"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={summary.completionPercentage}
        aria-valuetext={formatPercent(summary.completionPercentage)}
        className="dashboard-progress"
      >
        <span style={{ width: `${summary.completionPercentage}%` }} />
      </div>
      <p className="dashboard-completion-note">
        {summary.totalTasks === 0
          ? 'Chưa có công việc. Tiến độ sẽ xuất hiện khi bạn bắt đầu.'
          : `Còn ${formatCount(summary.todoTasks + summary.inProgressTasks)} công việc chưa hoàn thành.`}
      </p>
    </div>
  )
}

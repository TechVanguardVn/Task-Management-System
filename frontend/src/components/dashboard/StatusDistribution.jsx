import { useId } from 'react'
import { distribution, formatCount, formatPercent } from './presentation.js'

export function StatusDistribution({ summary }) {
  const titleId = useId()
  const descriptionId = useId()
  const segments = distribution(summary)

  return (
    <>
      {summary.totalTasks === 0 ? (
        <p className="dashboard-empty">
          Chưa có công việc để hiển thị phân bố trạng thái.
        </p>
      ) : (
        <div className="dashboard-donut-wrap">
          <svg
            viewBox="0 0 220 220"
            className="dashboard-donut"
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            <title id={titleId}>
              Phân bố {formatCount(summary.totalTasks)} công việc theo trạng
              thái
            </title>
            <desc id={descriptionId}>
              {segments
                .map(
                  (segment) =>
                    `${segment.label}: ${segment.count} (${formatPercent(segment.percentage)})`,
                )
                .join('; ')}
            </desc>
            <circle
              cx="110"
              cy="110"
              r="80"
              fill="none"
              stroke="#eeeef7"
              strokeWidth="20"
            />
            {segments.map((segment, index) => {
              const start = segments
                .slice(0, index)
                .reduce((total, previous) => total + previous.percentage, 0)
              return (
                <circle
                  key={segment.status}
                  cx="110"
                  cy="110"
                  r="80"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  pathLength="100"
                  strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 110 110)"
                />
              )
            })}
            <text
              x="110"
              y="108"
              textAnchor="middle"
              className="dashboard-donut-number"
            >
              {formatCount(summary.totalTasks)}
            </text>
            <text
              x="110"
              y="132"
              textAnchor="middle"
              className="dashboard-donut-label"
            >
              Công việc
            </text>
          </svg>
        </div>
      )}
      <ul className="dashboard-legend">
        {segments.map((segment) => (
          <li key={segment.status}>
            <span className="dashboard-legend-label">
              <span
                className="dashboard-dot"
                style={{ background: segment.color }}
              />
              {segment.label}
            </span>
            <span>
              {formatCount(segment.count)}{' '}
              <span className="dashboard-muted">
                ({formatPercent(segment.percentage)})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

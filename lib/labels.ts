// Give each task-status column a stable, theme-aware accent.
const COLUMN_ACCENT_ORDER = [
    'var(--color-label-blue)',
    'var(--color-label-green)',
    'var(--color-label-yellow)',
    'var(--color-label-purple)',
    'var(--color-label-orange)',
    'var(--color-label-red)',
]

export function columnAccentColor(position: number): string {
    return COLUMN_ACCENT_ORDER[position % COLUMN_ACCENT_ORDER.length]
}

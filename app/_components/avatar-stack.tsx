type Person = {
    id: string
    name: string
    email?: string
}

const sizeClass = {
    sm: 'w-6 h-6 text-[11px]',
    md: 'w-7 h-7 text-[11px]',
    lg: 'w-8 h-8 text-[12px]',
} as const

const baseClass =
    'inline-flex items-center justify-center shrink-0 rounded-full font-semibold'

function skinClass(onBoard: boolean) {
    return onBoard
        ? 'bg-[var(--color-midnight)] text-white ring-2 ring-[var(--color-paper)]'
        : 'bg-[var(--color-avatar-muted)] text-[var(--color-avatar-muted-ink)] ring-2 ring-[var(--color-paper)]'
}

// Native `title` renders each line separately, so the tooltip doubles as the
// "who is this" card without needing a popover.
function describe(person: Person) {
    const lines = [person.name]
    if (person.email) lines.push(person.email)
    return lines.join('\n')
}

export function Avatar({
    person,
    size = 'md',
    onBoard = false,
    className,
}: {
    person: Person
    size?: keyof typeof sizeClass
    onBoard?: boolean
    className?: string
}) {
    const classes = [baseClass, sizeClass[size], skinClass(onBoard), className]
        .filter(Boolean)
        .join(' ')
    const initial = person.name.slice(0, 1).toUpperCase()

    return (
        <span className={classes} title={describe(person)}>
            {initial}
        </span>
    )
}

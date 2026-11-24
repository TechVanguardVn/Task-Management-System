const paths = {
  email: 'M3 5h18v14H3z m0 0 9 7 9-7',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2Z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5z M12 14v3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  eyeOff:
    'm3 3 18 18 M10.5 5.1 1.5 5C18.5 5 22 12 22 12a20 20 0 0 1-3 3.8 M6.3 6.3A21 21 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.7-1.5 M10 10a3 3 0 0 0 4 4',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  check: 'm5 12 4 4L19 6',
  alert: 'M12 8v5 M12 17h.01 M12 3 2 21h20L12 3Z',
}

export function AuthIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}

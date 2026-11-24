import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle.js'

export function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="eyebrow">404 / Page not found</p>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">
        Let’s get you back on track.
      </h1>
      <p className="mt-4 leading-7 text-slate-500">
        This page doesn’t exist. Head back to your workspace to find your way.
      </p>
      <Link to="/dashboard" className="button-primary mt-8">
        Back to dashboard
      </Link>
    </div>
  )
}

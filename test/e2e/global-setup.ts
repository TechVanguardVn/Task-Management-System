import { execSync } from 'node:child_process'

export default function globalSetup() {
    if (process.env.E2E_BASE_URL) return
    execSync('npm run db:seed', { stdio: 'inherit' })
}
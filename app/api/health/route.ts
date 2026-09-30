import { db } from '@/db'
import {
    classifyDatabase,
    healthHttpStatus,
    summarizeHealth,
    type HealthCheck,
} from '@/lib/domain/health'
import { sql } from 'drizzle-orm'

/**
 * Liveness/readiness probe for the container healthcheck and the uptime
 * monitor. Deliberately unauthenticated, so the body carries statuses and
 * timings only — never error text, which can leak the database host or
 * user. Real errors go to the server log.
 *
 * Route Handlers aren't cached by default, and both probes hit the database
 * on every request, so this always runs fresh.
 */
export async function GET() {
    const checks: HealthCheck[] = []

    const startedAt = Date.now()
    try {
        await db.execute(sql`select 1`)
        const durationMs = Date.now() - startedAt
        checks.push({
            name: 'database',
            status: classifyDatabase(durationMs),
            durationMs,
        })
    } catch (error) {
        console.error('[health] database probe failed', error)
        checks.push({
            name: 'database',
            status: 'down',
            durationMs: Date.now() - startedAt,
            detail: 'unreachable',
        })
    }

    const report = summarizeHealth(checks)

    return Response.json(
        { ...report, timestamp: new Date().toISOString() },
        {
            status: healthHttpStatus(report.status),
            headers: { 'cache-control': 'no-store' },
        }
    )
}

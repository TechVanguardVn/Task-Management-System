import { expect, test } from '@playwright/test'

test('health endpoint reports database status without leaking connection details', async ({
    request,
}) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toContain('no-store')

    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.checks.map((check: { name: string }) => check.name)).toEqual([
        'database',
    ])

    const raw = JSON.stringify(body)
    expect(raw).not.toContain('postgresql://')
    expect(raw).not.toContain('password')
})
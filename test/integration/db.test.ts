import * as schema from '@/db/schema'
import { getMembership } from '@/lib/auth/membership'
import { isActiveMember } from '@/lib/domain/authorization'
import { listBoardsForUser } from '@/lib/queries/boards'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { execSync } from 'node:child_process'
import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const testDatabaseUrl = process.env.DATABASE_URL ?? ''
if (!testDatabaseUrl.includes('stackboard_test')) {
    throw new Error(
        'Refusing to run destructive integration tests: DATABASE_URL must point at stackboard_test.'
    )
}

const client = postgres(testDatabaseUrl, { max: 1 })
const db = drizzle(client, { schema })

async function resetSchema() {
    await client`drop schema if exists public cascade`
    await client`drop schema if exists drizzle cascade`
    await client`create schema public`
}

async function applyMigrations() {
    execSync('npm run db:migrate', {
        env: { ...process.env, DATABASE_URL: testDatabaseUrl },
        stdio: 'inherit',
        cwd: process.cwd(),
    })
}

beforeAll(async () => {
    await resetSchema()
    await applyMigrations()
}, 60_000)

afterAll(async () => {
    await client.end()
})

beforeEach(async () => {
    await db.delete(schema.comments)
    await db.delete(schema.cards)
    await db.delete(schema.columns)
    await db.delete(schema.boardMemberships)
    await db.delete(schema.boards)
    await db.delete(schema.sessions)
    await db.delete(schema.users)
})

async function createAccountBoard(name: string, email: string) {
    const [user] = await db
        .insert(schema.users)
        .values({ name, email, passwordHash: 'test-hash' })
        .returning()
    const [board] = await db
        .insert(schema.boards)
        .values({ name: `${name}'s board`, ownerId: user.id })
        .returning()
    await db.insert(schema.boardMemberships).values({
        boardId: board.id,
        userId: user.id,
        role: 'owner',
    })
    return { user, board }
}

describe('account-scoped boards and tasks', () => {
    it('lists only boards belonging to the current user', async () => {
        const alice = await createAccountBoard('Alice', 'alice@test.dev')
        await createAccountBoard('Bob', 'bob@test.dev')

        const result = await listBoardsForUser(alice.user.id)
        expect(result.active.map((item) => item.board.id)).toEqual([
            alice.board.id,
        ])
    })

    it('requires active membership and hides access after removal', async () => {
        const { user, board } = await createAccountBoard(
            'Owner',
            'owner@test.dev'
        )
        expect(isActiveMember(await getMembership(board.id, user.id))).toBe(
            true
        )

        await db
            .update(schema.boardMemberships)
            .set({ status: 'removed', removedAt: new Date() })
            .where(eq(schema.boardMemberships.userId, user.id))

        expect(isActiveMember(await getMembership(board.id, user.id))).toBe(
            false
        )
    })

    it('persists a task with priority and a due date in its status column', async () => {
        const { user, board } = await createAccountBoard(
            'Owner',
            'task-owner@test.dev'
        )
        const [column] = await db
            .insert(schema.columns)
            .values({ boardId: board.id, name: 'To do', position: 0 })
            .returning()
        const dueDate = new Date('2030-05-01T00:00:00.000Z')
        const [task] = await db
            .insert(schema.cards)
            .values({
                boardId: board.id,
                columnId: column.id,
                title: 'Finish MVP',
                description: 'Verify persistence.',
                priority: 'high',
                dueDate,
                position: 0,
            })
            .returning()

        expect(task.columnId).toBe(column.id)
        expect(task.priority).toBe('high')
        expect(task.dueDate?.toISOString()).toBe(dueDate.toISOString())
        expect(user.id).toBe(board.ownerId)
    })
})
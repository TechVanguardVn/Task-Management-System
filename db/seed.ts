import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import postgres from 'postgres'
import * as schema from './schema'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derived = (await scryptAsync(password, salt, 64)) as Buffer
    return `${salt}:${derived.toString('hex')}`
}

async function main() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('DATABASE_URL is not set')

    const client = postgres(connectionString, { max: 1 })
    const db = drizzle(client, { schema })

    try {
        console.log('Seeding: clearing existing data…')
        await db.delete(schema.jobs)
        await db.delete(schema.notifications)
        await db.delete(schema.attachments)
        await db.delete(schema.cardWatchers)
        await db.delete(schema.activityEvents)
        await db.delete(schema.comments)
        await db.delete(schema.checklistItems)
        await db.delete(schema.cardLabels)
        await db.delete(schema.cardDependencies)
        await db.delete(schema.cards)
        await db.delete(schema.labels)
        await db.delete(schema.columns)
        await db.delete(schema.invitations)
        await db.delete(schema.boardMemberships)
        await db.delete(schema.boards)
        await db.delete(schema.sessions)
        await db.delete(schema.users)

        const [owner] = await db
            .insert(schema.users)
            .values({
                name: 'Alice Owens',
                email: 'alice@example.com',
                passwordHash: await hashPassword('password123'),
            })
            .returning()

        const [board] = await db
            .insert(schema.boards)
            .values({ name: 'Website Redesign', ownerId: owner.id })
            .returning()

        await db.insert(schema.boardMemberships).values({
            boardId: board.id,
            userId: owner.id,
            role: 'owner',
        })

        const [toDo, inProgress, done] = await db
            .insert(schema.columns)
            .values([
                { boardId: board.id, name: 'To do', position: 0 },
                { boardId: board.id, name: 'In progress', position: 1 },
                { boardId: board.id, name: 'Done', position: 2 },
            ])
            .returning()

        const today = new Date()

        await db.insert(schema.cards).values([
            {
                boardId: board.id,
                columnId: toDo.id,
                title: 'Product Redesign',
                description:
                    'Redesign the core user experience and touchpoints for modern aesthetic.',
                priority: 'medium',
                dueDate: today,
                position: 0,
            },
            {
                boardId: board.id,
                columnId: inProgress.id,
                title: 'Mobile App Beta',
                description:
                    'Finalize beta test deployments and polish responsive interactions.',
                priority: 'medium',
                dueDate: today,
                position: 0,
            },
            {
                boardId: board.id,
                columnId: inProgress.id,
                title: 'Performance Optimization',
                description:
                    'Improve load times, reduce bundle size, and optimize database queries.',
                priority: 'medium',
                dueDate: today,
                position: 1,
            },
            {
                boardId: board.id,
                columnId: done.id,
                title: 'API Integration for Tasks',
                description:
                    'Complete endpoint integration and verify JSON payloads.',
                priority: 'medium',
                dueDate: today,
                position: 0,
            },
        ])

        console.log(
            `Seeded ${owner.email} with board "${board.name}" matching Taskflow design. Password: password123`
        )
    } finally {
        await client.end()
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
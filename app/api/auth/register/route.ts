import { NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { signupSchema } from '@/lib/validation/auth'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = signupSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? 'Invalid request data' },
                { status: 400 }
            )
        }

        const existing = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, parsed.data.email))
            .limit(1)

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'An account with that email already exists' },
                { status: 400 }
            )
        }

        const passwordHash = await hashPassword(parsed.data.password)

        const [user] = await db.transaction(async (tx) => {
            const [newUser] = await tx
                .insert(schema.users)
                .values({
                    name: parsed.data.name,
                    email: parsed.data.email,
                    passwordHash,
                })
                .returning()

            // Initialize a default board with standard 3 columns (To do, In progress, Done)
            const [board] = await tx
                .insert(schema.boards)
                .values({
                    name: 'My Tasks',
                    ownerId: newUser.id,
                })
                .returning()

            await tx.insert(schema.boardMemberships).values({
                boardId: board.id,
                userId: newUser.id,
                role: 'owner',
            })

            await tx.insert(schema.columns).values([
                { boardId: board.id, name: 'To do', position: 0 },
                { boardId: board.id, name: 'In progress', position: 1 },
                { boardId: board.id, name: 'Done', position: 2 },
            ])

            return [newUser]
        })

        await createSession(user.id)

        return NextResponse.json(
            {
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 }
        )
    } catch (err) {
        console.error('Error registering user:', err)
        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        )
    }
}

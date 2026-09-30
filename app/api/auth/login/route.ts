import { NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { loginSchema } from '@/lib/validation/auth'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = loginSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? 'Invalid request data' },
                { status: 400 }
            )
        }

        const rows = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, parsed.data.email))
            .limit(1)

        const user = rows[0]
        if (
            !user ||
            !(await verifyPassword(parsed.data.password, user.passwordHash))
        ) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        await createSession(user.id)

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        })
    } catch (err) {
        console.error('Error logging in:', err)
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        )
    }
}

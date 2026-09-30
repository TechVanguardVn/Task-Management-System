import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

export async function POST() {
    try {
        await destroySession()
        return NextResponse.json({ message: 'Logged out successfully' })
    } catch (err) {
        console.error('Error logging out:', err)
        return NextResponse.json(
            { error: 'Failed to logout' },
            { status: 500 }
        )
    }
}

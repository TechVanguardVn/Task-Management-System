import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getUserDashboardData } from '@/lib/queries/dashboard'

export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        const data = await getUserDashboardData(user.id)
        return NextResponse.json(data)
    } catch (err) {
        console.error('Error fetching dashboard data:', err)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        )
    }
}

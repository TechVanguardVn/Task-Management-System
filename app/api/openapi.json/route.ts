import { openApiSpec } from '@/lib/openapi'
import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json(openApiSpec, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
        },
    })
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
        null,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
      ts: new Date().toISOString(),
    },
    { status: 200 }
  )
}


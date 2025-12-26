import { NextRequest } from 'next/server'
import { handleContactPost } from './_handler'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  return handleContactPost(request)
}


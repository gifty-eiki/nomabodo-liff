import { NextResponse } from 'next/server'
import { getLineUserId } from '@/lib/line'
import { createAdminToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  const token = getLineUserId(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ADMIN_ACCESS_TOKEN = process.env.ADMIN_ACCESS_TOKEN
  if (!ADMIN_ACCESS_TOKEN || token !== ADMIN_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const adminToken = await createAdminToken('admin')

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}

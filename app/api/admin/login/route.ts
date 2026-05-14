import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyLineToken, getLineUserId } from '@/lib/line'
import { createAdminToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  const token = getLineUserId(request)
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lineUserId = await verifyLineToken(token)
  if (!lineUserId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({ where: { lineUserId } })
  if (!profile?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminToken = await createAdminToken(lineUserId)

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
